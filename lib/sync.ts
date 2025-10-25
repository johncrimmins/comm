import { onSnapshot, collection, query, where, Unsubscribe, doc, orderBy, Timestamp, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import {
  enqueueSyncOp,
  nextSyncOp,
  incrementSyncOpAttempt,
  markOpDone,
  ensureConversationForRemote,
  findLocalConversationIdByRemote,
  getRemoteIdForLocalConversation,
  upsertMessageFromRemote,
  applyOutgoingStatusMarkers,
  setTyping,
  upsertReceipt,
  upsertUserPresence,
} from '@/lib/sqlite';
import { linkRemoteConversationId } from '@/lib/sqlite';
import { markLocalAsSentByMatch } from '@/lib/sqlite';

// Sync engine scaffolding: lifecycle, active conversation routing, outbox backoff

let currentUserId: string | null = null;
let activeConversationId: string | null = null;

let conversationsUnsub: Unsubscribe | null = null;
let messagesUnsub: Unsubscribe | null = null;
let stateUnsub: Unsubscribe | null = null;

let presenceTimer: ReturnType<typeof setInterval> | null = null;
let outboxTimer: ReturnType<typeof setTimeout> | null = null;
let backoffIdx = 0;
const backoffSeq = [1000, 2000, 4000, 8000, 16000];

export function startSync(userId: string) {
  if (currentUserId === userId) return;
  currentUserId = userId;

  attachConversationsListener();
  startPresenceHeartbeat();
  scheduleOutbox();
}

export function stopSync() {
  detachConversationsListener();
  detachActiveListeners();
  stopPresenceHeartbeat();
  cancelOutbox();
  currentUserId = null;
  activeConversationId = null;
}

export function setActiveConversationId(conversationId: string | null) {
  if (activeConversationId === conversationId) return;
  detachActiveListeners();
  activeConversationId = conversationId;
  if (activeConversationId) {
    attachMessagesListener(activeConversationId);
    attachRealtimeStateListener(activeConversationId);
  }
}

export function onReconnect() {
  // Reset backoff and try outbox immediately on reconnect
  backoffIdx = 0;
  scheduleOutbox(0);
}

function attachConversationsListener() {
  if (!currentUserId || conversationsUnsub) return;
  const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', currentUserId));
  conversationsUnsub = onSnapshot(q, async (snap) => {
    for (const d of snap.docs) {
      const data = d.data() as any;
      const participantIds: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];
      const createdAtMs = (data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now());
      const updatedAtMs = (data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now());
      await ensureConversationForRemote(d.id, participantIds, createdAtMs, updatedAtMs);
    }
  });
}

function detachConversationsListener() {
  if (conversationsUnsub) {
    conversationsUnsub();
    conversationsUnsub = null;
  }
}

function attachMessagesListener(conversationId: string) {
  if (messagesUnsub) messagesUnsub();
  // Resolve remote id mapping
  messagesUnsub = null;
  void (async () => {
    const remoteId = await getRemoteIdForLocalConversation(conversationId);
    if (!remoteId) return;
    const msgsRef = collection(db, 'conversations', remoteId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    messagesUnsub = onSnapshot(q, async (snap) => {
      for (const d of snap.docChanges()) {
        if (d.type === 'added' || d.type === 'modified') {
          const data = d.doc.data() as any;
          const text = String(data.text ?? '');
          const senderId = String(data.senderId ?? '');
          const createdAtMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
          await upsertMessageFromRemote(d.doc.id, conversationId, senderId, text, createdAtMs);
          // If this is our own message, ensure local status moves to 'sent' with server timestamp
          if (currentUserId && senderId === currentUserId) {
            await markLocalAsSentByMatch(conversationId, senderId, text, createdAtMs);
          }
        }
      }
    });
  })();
}

function attachRealtimeStateListener(conversationId: string) {
  if (stateUnsub) stateUnsub();
  stateUnsub = null;
  void (async () => {
    const remoteId = await getRemoteIdForLocalConversation(conversationId);
    if (!remoteId) return;
    const stateRef = doc(db, 'conversations', remoteId, 'state', 'state');
    stateUnsub = onSnapshot(stateRef, async (snap) => {
      const data = snap.data() as any | undefined;
      if (!data) return;
      // Typing
      const typing = (data.typing ?? {}) as Record<string, { isTyping: boolean; updatedAt?: Timestamp }>;
      const now = Date.now();
      for (const [userId, v] of Object.entries(typing)) {
        const updatedAtMs = v?.updatedAt instanceof Timestamp ? v.updatedAt.toMillis() : now;
        const isTyping = Boolean(v?.isTyping) && (now - updatedAtMs) <= 5000; // 5s TTL
        await setTyping(conversationId, userId, isTyping, updatedAtMs);
      }
      // Delivery / Read markers
      const delivery = (data.delivery?.lastDeliveredAt ?? {}) as Record<string, Timestamp | undefined>;
      const read = (data.read?.lastReadAt ?? {}) as Record<string, Timestamp | undefined>;
      const otherUserIds = Object.keys({ ...delivery, ...read }).filter((u) => u !== currentUserId);
      const minDeliveredAtMs = otherUserIds.length
        ? Math.min(
            ...otherUserIds
              .map((u) => delivery[u])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
          )
        : null;
      const minReadAtMs = otherUserIds.length
        ? Math.min(
            ...otherUserIds
              .map((u) => read[u])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
          )
        : null;
      if (currentUserId) {
        await applyOutgoingStatusMarkers(conversationId, currentUserId, minDeliveredAtMs, minReadAtMs);
      // Do not mirror our own read receipt based on others' markers
      }
    });
  })();
}

function detachActiveListeners() {
  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
  }
  if (stateUnsub) {
    stateUnsub();
    stateUnsub = null;
  }
}

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  presenceTimer = setInterval(async () => {
    if (!currentUserId) return;
    const userRef = doc(db, 'users', currentUserId);
    try {
      // Best-effort heartbeat; also mirror locally
      await setDoc(userRef, { lastActiveAt: Timestamp.now(), online: true }, { merge: true });
      await upsertUserPresence(currentUserId, true, Date.now());
    } catch {
      // silent per MVP
    }
  }, 30000);
}

function stopPresenceHeartbeat() {
  if (presenceTimer) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
}

async function processOutboxOnce(): Promise<boolean> {
  const op = await nextSyncOp();
  if (!op) return false;
  try {
    const payload = JSON.parse(op.payload || '{}');
    if (op.type === 'createConversation') {
      const ref = doc(collection(db, 'conversations'));
      await setDoc(ref, { participantIds: payload.participantIds ?? [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      if (payload.conversationId) {
        await linkRemoteConversationId(payload.conversationId, ref.id);
      }
    } else if (op.type === 'sendMessage') {
      const remoteId = await getRemoteIdForLocalConversation(payload.conversationId);
      if (!remoteId) throw new Error('Missing remoteId for conversation');
      const msgRef = doc(collection(db, 'conversations', remoteId, 'messages'));
      await setDoc(msgRef, { text: payload.text ?? '', senderId: payload.senderId ?? '', createdAt: serverTimestamp() });
      // Status will update via messages listener on ack
    } else if (op.type === 'markRead') {
      const remoteId = await getRemoteIdForLocalConversation(payload.conversationId);
      if (remoteId && payload.userId) {
        const stateRef = doc(db, 'conversations', remoteId, 'state', 'state');
        await updateDoc(stateRef, { [`read.lastReadAt.${payload.userId}`]: Timestamp.fromMillis(payload.at ?? Date.now()) });
      }
    } else if (op.type === 'typing') {
      const remoteId = await getRemoteIdForLocalConversation(payload.conversationId);
      if (remoteId && currentUserId) {
        const stateRef = doc(db, 'conversations', remoteId, 'state', 'state');
        await updateDoc(stateRef, { [`typing.${currentUserId}`]: { isTyping: !!payload.isTyping, updatedAt: serverTimestamp() } });
      }
    }
    await markOpDone(op.id);
    backoffIdx = 0; // reset on success
    return true;
  } catch (err: any) {
    await incrementSyncOpAttempt(op.id, String(err?.message ?? err));
    backoffIdx = Math.min(backoffIdx + 1, backoffSeq.length - 1);
    return false;
  }
}

function scheduleOutbox(delay?: number) {
  cancelOutbox();
  const ms = delay ?? backoffSeq[backoffIdx];
  outboxTimer = setTimeout(async () => {
    const progressed = await processOutboxOnce();
    if (progressed) {
      scheduleOutbox(0); // try immediately for next op
    } else {
      scheduleOutbox(); // backoff
    }
  }, ms);
}

function cancelOutbox() {
  if (outboxTimer) {
    clearTimeout(outboxTimer);
    outboxTimer = null;
  }
}

// Convenience helper to enqueue typing state (used by UI later)
export async function enqueueTyping(conversationId: string, isTyping: boolean) {
  await enqueueSyncOp('typing', { conversationId, isTyping, at: Date.now() });
}



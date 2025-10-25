import {
  insertConversation,
  insertMessage,
  listMessagesByConversation,
  enqueueSyncOp,
  upsertReceipt,
} from '@/lib/sqlite';

export async function createConversationLocal(participantIds: string[]): Promise<{ conversationId: string }> {
  const convo = await insertConversation(participantIds);
  await enqueueSyncOp('createConversation', { conversationId: convo.id, participantIds });
  return { conversationId: convo.id };
}

export async function sendMessageLocal(
  conversationId: string,
  text: string,
  senderId: string
): Promise<{ messageId: string; shouldNavigate: boolean }> {
  // Determine if this is the first message (before inserting)
  const existing = await listMessagesByConversation(conversationId);
  const wasEmpty = existing.length === 0;

  const msg = await insertMessage(conversationId, senderId, text);
  await enqueueSyncOp('sendMessage', {
    conversationId,
    messageId: msg.id,
    text,
    senderId,
    createdAt: msg.createdAt,
  });
  return { messageId: msg.id, shouldNavigate: wasEmpty };
}

export async function markRead(
  conversationId: string,
  userId: string,
  atMs: number = Date.now()
): Promise<void> {
  await upsertReceipt(conversationId, userId, atMs);
  await enqueueSyncOp('markRead', { conversationId, userId, at: atMs });
}

export async function getUnreadCountFor(
  conversationId: string,
  currentUserId: string
): Promise<number> {
  // Best-effort: count messages newer than user's last read and not sent by user
  // We could add a dedicated DAO, but this keeps the service self-contained.
  const messages = await listMessagesByConversation(conversationId);
  // Last read is not directly available here; a full DAO could fetch it. For MVP, approximate by counting
  // all messages not from current user (UI generally derives per list view via preview function).
  return messages.filter((m) => m.senderId !== currentUserId).length;
}


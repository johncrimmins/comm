### PRD: Comm — Cross-Platform Messaging App (MVP, Local-First + Firestore Sync)

#### Objective
Deliver a production-ready messaging MVP where the UI always reflects the local SQLite database as the source of truth, with real-time, multi-device sync to Firestore. Firestore is canonical for the local database; all remote events are merged into SQLite. No push notifications in this phase.

#### Tech Stack (explicit)
- Client: Expo SDK 54, React Native 0.81, Expo Router v6, TypeScript (strict), Reanimated, Gesture Handler, existing UI components/styles.
- Local DB: Expo SQLite (local-first read/write; queued ops when offline).
- Backend: Firebase Auth (accounts), Firestore (messages/conversations/presence/typing/receipts), Cloud Functions (for server-side helpers; FCM infra for future push — not in scope).
- Real-time: Firestore listeners (live updates).
- Deployment: Expo Go on emulators/simulators; Firebase backend deployed.

#### Principles
- Local-first: UI renders exclusively from SQLite. All writes hit SQLite immediately; sync engine mirrors to/from Firestore.
- Canonical remote: Firestore is the authority; conflicts are resolved by accepting Firestore values when discrepancies occur.
- Minimal statuses: sent, delivered, read. No “sending”.
- Dynamic routing: `app/chat/[id].tsx` opens conversations by local `conversationId`. Local conversations are created first; a `remoteId` is associated post-sync.

---

### In Scope
- One-on-one and group chat (3+ participants).
- Real-time sync across devices via Firestore listeners.
- Auth (Firebase Auth).
- Message persistence across restarts (SQLite).
- Optimistic UI: messages insert instantly in SQLite; statuses update from sync.
- Presence (online/offline), typing indicators.
- Timestamps on all messages.
- Read receipts.
- Delivery states: sent → delivered → read.
- Offline mode: queue locally and reconcile on reconnect.
- App lifecycle handling for sync.

### Out of Scope (this phase)
- Push notifications.
- Media messages (text only).
- Profile pictures (display names only).

---

### User Flow Constraint (Existing Behavior Retained)
- Creating a conversation does not immediately navigate to the thread. Navigation to `app/chat/[id]` happens only after the user sends the first message (send button). Conversation is created locally first; first message send triggers navigation and sync.

---

### Key User Stories
- As a user, I sign in and see my conversations with last message and unread count.
- I can start a one-on-one or group conversation and send text messages.
- Messages appear immediately; their status updates from sent → delivered → read.
- I see timestamps, presence (online), and typing indicators.
- If I go offline, I can keep chatting; messages send on reconnect and histories merge.
- After force-quitting and reopening, my chat history is intact from SQLite and resumes syncing.

---

### Functional Requirements

#### Authentication
- Sign in/out using Firebase Auth.
- Persist current user locally for session restore.

#### Conversations
- Local-first creation in SQLite with generated `conversationId` and participants.
- Do not navigate yet. On first message send, navigate to `app/chat/[id]` using the local `conversationId`.
- Background sync creates/links a `remoteId` in Firestore; store mapping in SQLite without changing the local `conversationId`.
- Conversation list shows last message preview and unread count.

#### Messaging (text only)
- Send: Insert message locally with provisional timestamp; enqueue for sync. On Firestore write acknowledgement, set `status: sent` and persist server timestamp.
- Delivered: A message is marked delivered when the recipient’s delivery marker for the conversation in Firestore is >= the message server timestamp. This marker is mirrored into SQLite via listener and applied to messages.
- Read: When a user views a conversation, update Firestore read marker for that conversation (e.g., `lastReadAt`); listener mirrors to SQLite. Messages with `createdAt <= lastReadAt` are `read`.
- Incoming: Firestore listeners update SQLite; UI re-renders from SQLite.
- Timestamps: Prefer Firestore server timestamps once available; reconcile local provisional values.

#### Presence
- Online status per user maintained in Firestore (heartbeat or lastActiveAt). Listener mirrors to SQLite for UI rendering.

#### Typing Indicators
- Per-conversation realtime state document in Firestore includes `typing` for all participants with a short TTL/timeout policy. A single realtime listener (realtimeListener) for the active conversation mirrors this state into SQLite.

#### Offline behavior
- All writes perform against SQLite first and are enqueued for sync.
- On reconnect, a background sync flushes queued ops to Firestore with retries and backoff.
- Remote changes are merged into SQLite. Firestore values win on conflicts.
- No bootstrap/backfill step in MVP; initial snapshots from listeners populate SQLite incrementally.

#### Routing
- `app/chat/[id].tsx` renders by local `conversationId`.
- `remoteId` is for sync only; local IDs remain stable for routing.

#### Listener strategy
- Conversations list: one query listener attached after auth (scoped to the current user).
- Active thread: one messages listener and one realtime state listener (realtimeListener) for read/delivery/typing of the current conversation only.
- Listeners are detached when not needed (e.g., on navigation away); hooks do not attach listeners directly.

---

### Data Model

#### SQLite (rendering source of truth)
- users: id, remoteId?, displayName, lastActiveAt, isOnline
- conversations: id, remoteId?, createdAt, updatedAt
- participants: conversationId, userId, role
- messages: id, conversationId, senderId, text, createdAt, serverCreatedAt?, status('sent'|'delivered'|'read')
- receipts: conversationId, userId, lastReadAt
- typing: conversationId, userId, isTyping, updatedAt
- sync_ops: id, type, payload, createdAt, attemptCount, error?

Note: `title` removed to keep one-to-one mapping; UI derives titles from participants.

#### Firestore (canonical)
- users/{uid}: displayName, lastActiveAt, online
- conversations/{remoteId}: participantIds[], createdAt, updatedAt
- conversations/{remoteId}/messages/{remoteMsgId}: senderId, text, createdAt
- conversations/{remoteId}/state (single realtime state document per conversation):
  - read: lastReadAt: { [userId]: Timestamp }
  - delivery: lastDeliveredAt: { [userId]: Timestamp }
  - typing: { [userId]: { isTyping: boolean, updatedAt: Timestamp } }

No separate mappings collection; local stores `remoteId` alongside records.

---

### Sync & Status Semantics
- Sent: On Firestore write ack (or when the message appears via the messages listener), set `status=sent` and `serverCreatedAt`.
- Delivered: When `state.delivery.lastDeliveredAt[recipientId] >= message.serverCreatedAt` for all recipients except the sender, mark as delivered.
- Read: When `state.read.lastReadAt[recipientId] >= message.serverCreatedAt` for all recipients except the sender, mark as read.
- Conflict resolution: Firestore wins; local provisional fields are overwritten.

---

### Acceptance Criteria
- Auth: Sign in/out works; user identity persists locally.
- Conversations: Local-first create; only navigate to thread after first message send; remoteId linkage occurs transparently without changing routing IDs.
- Messaging: Messages insert instantly; progress to sent on Firestore ack; to delivered when delivery markers advance; to read when read markers advance. Timestamps reconcile to server.
- Presence/Typing: Online badges and typing indicators reflect Firestore and mirror into SQLite.
- Offline: While offline, messages queue; on reconnect they sync and statuses update. Force-quit/reopen shows history from SQLite and resumes sync.
- Multi-device: Real-time updates across devices via Firestore.
- Performance: Smooth UX, no crashes in routine flows.

- Hooks read from SQLite only; sync engine owns Firestore listeners. Hooks may signal the active conversation ID to the sync engine but do not attach listeners directly.
- No bootstrap/backfill step; initial listener snapshots populate SQLite.

---

### Test Scenarios
- Two devices same conversation: sent→delivered→read via markers.
- Offline queue: send while offline, reopen, reconnect → sync and status updates.
- Group chat (3+): delivered/read reflect per-participant markers.
- Typing: shows while composing and clears on timeout.
- Routing: first message send triggers navigation using local ID; remote linkage does not disrupt the route.

---

### Risks & Mitigations
- Delivery detection: Use simple delivery markers per user per conversation in Firestore (`lastDeliveredAt`).
- Offline reconciliation: Robust `sync_ops` with retries/backoff; idempotent Firestore writes.
- ID mapping: Keep stable local IDs with inline `remoteId` to avoid route churn.

---

### MVP Project Structure (concise tree)

```text
lib/
  firebase.ts         # Firebase init + typed refs
  sqlite.ts           # SQLite init + schema helpers
  sync.ts             # Outbox, listeners, reconciliation (realtimeListener)
services/
  chat.ts             # Create conversation, send, markRead
hooks/
  useAuth.ts          # Firebase auth session
  useConversations.ts # Read conversations from SQLite (UI-only)
  useMessages.ts      # Read messages from SQLite; signals active convo ID
app/
  (auth)/
  (tabs)/
  chat/
    [id].tsx         # Thread screen (local conversationId)
  new-conversation.tsx
```



## Relevant Files

- `lib/firebase/app.ts` - Firebase initialization and app instance (already present).
- `lib/firebase/auth.ts` - Firebase Auth helpers (already present).
- `lib/firebase/db.ts` - Firestore instance (already present).
- `lib/sqlite.ts` - SQLite initialization, schema, DAOs. (new)
- `lib/sync.ts` - Sync engine: outbox, listeners, reconciliation. (new)
- `services/chat.ts` - Conversation/message services (refactor to SQLite-first).
- `hooks/useAuth.ts` - Auth session hook. (new)
- `hooks/useConversations.ts` - Read conversations from SQLite; exposes list. (new)
- `hooks/useMessages.ts` - Read messages from SQLite; signals active convo ID. (new)
- `app/chat/[id].tsx` - Thread screen rendering by local `conversationId`.
- `app/new-conversation.tsx` - New conversation flow; navigate after first send.
- `components/chat/Message.tsx` - Message item rendering.

### Notes

- Place tests alongside code files where applicable (e.g., `foo.ts` and `foo.test.ts`).
- Run tests with `npx jest` (or `npx jest path/to/test`).

## Tasks

- [x] 1.0 Initialize Firebase and Auth session handling
  - [x] 1.1 Verify Firebase env vars: `EXPO_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`.
  - [x] 1.2 Confirm `lib/firebase/app.ts` init guards missing envs (dev log only) and returns a single app instance.
  - [x] 1.3 Ensure `lib/firebase/auth.ts` exports `auth`, `onAuth`, `signIn`, `signUp`, `logOut` and types.
  - [x] 1.4 Create `hooks/useAuth.ts` to expose the current user via `onAuthStateChanged` with proper cleanup.
  - [x] 1.5 Wire minimal consumer usage in screens without adding global state (keep simple for MVP).

- [x] 2.0 Implement SQLite schema and data access utilities
  - [x] 2.1 Create `lib/sqlite.ts` with idempotent init and tables: `users`, `conversations`, `participants`, `messages`, `receipts`, `typing`, `sync_ops`.
  - [x] 2.2 Add indices for query performance (e.g., `messages(conversationId, createdAt)`).
  - [x] 2.3 Implement DAOs: `insertConversation`, `insertMessage`, `listConversationsWithPreview`, `listMessagesByConversation`, `upsertReceipt`, `setTyping`, `enqueueSyncOp`, `nextSyncOp`, `markOpDone`.
  - [x] 2.4 Define strict TS types aligning with the PRD models (serverCreatedAt optional, status enum).
  - [x] 2.5 Provide lightweight migration/versioning mechanism (pragma/user_version).

- [ ] 3.0 Build sync engine and realtime listeners (conversations, messages, state)
  - [x] 3.1 Create `lib/sync.ts` with attach/detach lifecycle and `setActiveConversationId` API.
  - [x] 3.2 Implement outbox processor with minimal backoff: 1s → 2s → 4s → 8s → 16s (max 5 attempts); reset on reconnect.
  - [x] 3.3 Implement conversations list listener (user-scoped) that mirrors remote updates into SQLite.
  - [x] 3.4 Implement active messages listener to upsert messages; set `status=sent` when acked.
  - [x] 3.5 Implement realtime state listener (single doc) for read/delivery/typing; apply 5s typing TTL.
  - [x] 3.6 Implement presence heartbeat (30s) and mirror presence into SQLite for UI.
  - [x] 3.7 Implement `linkRemoteConversationId` to store Firestore `remoteId` alongside local rows.
  - [x] 3.8 Ensure listeners detach on navigation away to avoid leaks.

- [ ] 4.0 Implement conversations and messaging services with routing constraint
  - [x] 4.1 Refactor `services/chat.ts` to be SQLite-first (stop direct Firestore writes; enqueue sync ops).
  - [x] 4.2 `createConversationLocal(participantIds)` returns local `conversationId` without navigation.
  - [x] 4.3 `sendMessageLocal(conversationId, text, senderId)` writes to SQLite, enqueues outbox; triggers navigation only for the first message.
  - [x] 4.4 `markRead(conversationId, userId, at)` updates SQLite receipts and enqueues remote marker.
  - [x] 4.5 Compute unread counts from receipts vs. messages; expose helper.

- [ ] 5.0 Implement UI hooks and integrate into screens (presence/typing reflected)
  - [x] 5.1 Create `hooks/useConversations.ts` to read conversations from SQLite with last message + unread count.
  - [x] 5.2 Create `hooks/useMessages.ts` to read by `conversationId` from SQLite and call `setActiveConversationId`.
  - [x] 5.3 Update `app/new-conversation.tsx` to create locally and delay navigation until first send.
  - [x] 5.4 Update `app/chat/[id].tsx` to render from SQLite and use services for send/read.
  - [x] 5.5 Update `components/chat/Message.tsx` to display status (sent/delivered/read) and timestamps.
  - [x] 5.6 Reflect typing indicator and presence using mirrored SQLite state (no extra listeners in hooks).

- [ ] 6.0 Implement offline queue, retry/backoff, and silent error handling
  - [ ] 6.1 Ensure all write paths function offline via SQLite + outbox only.
  - [ ] 6.2 Trigger outbox flush on reconnect and timer; log errors silently (no UI banners/toasts).
  - [ ] 6.3 Add minimal dev logging toggles for diagnostics (disabled by default).

- [ ] 7.0 Validate acceptance criteria on Expo Go (manual scenarios)
  - [ ] 7.1 Two devices: A sends → B sees within ~1s; statuses advance correctly.
  - [ ] 7.2 Offline send → force-quit → reopen → reconnect: history from SQLite; outbox flushes.
  - [ ] 7.3 Group chat (≥3 participants) basic flow; no hard participant cap enforced.
  - [ ] 7.4 Navigation occurs only after first message send using local `conversationId`.
  - [ ] 7.5 Timestamps reconcile to server; smooth scroll; no crashes on routine flows.



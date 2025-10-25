### Feature PRD — Epic 1: Messaging Core (Send A → appears on B)

#### Introduction / Overview
Build the core real-time messaging experience so that two signed-in users can exchange text messages with local-first UX and Firestore-backed synchronization. The UI renders exclusively from SQLite (local-first); Firestore is the canonical remote source of truth. Statuses progress sent → delivered → read based on server timestamps and per-recipient markers. Navigation to a thread happens only after the first message is sent.

#### Goals
- Provide reliable A↔B text messaging with near-real-time propagation (~1s target).
- Maintain SQLite as the rendering source of truth; reconcile with Firestore.
- Implement minimal, scoped listeners: conversations list; active thread messages; active conversation realtime state (read/delivery/typing).
- Enforce routing constraint: navigate to `app/chat/[id].tsx` only after first send.
- Deliver smooth, crash-free UX with consistent timestamps and responsive scroll.

#### User Stories
- As a user, I sign in and see my conversations with last message and unread count.
- As a user, I can start a one-on-one or group conversation and send text messages.
- As a user, my sent message appears immediately and progresses sent → delivered → read.
- As a user, I see timestamps and typing indicators while composing.
- As a user, if I go offline, I can keep chatting; messages send on reconnect and histories merge.
- As a user, after a force-quit/reopen, my chat history loads from SQLite and resumes syncing.
- As a user, the app navigates to the newly created conversation only after I press send for the first message.

#### Functional Requirements
1. Authentication
   1.1 Support sign in/out using Firebase Auth.
   1.2 Persist current user locally for session restoration.

2. Conversations
   2.1 Create conversations locally in SQLite with generated `conversationId` and participants.
   2.2 Do not navigate upon conversation creation.
   2.3 On first message send, navigate to `app/chat/[id]` using the local `conversationId`.
   2.4 Background sync creates/links a `remoteId` in Firestore and persists it alongside the local record without changing the local `conversationId`.
   2.5 Conversations list shows last message preview and unread count.

3. Messaging (Text Only)
   3.1 Send flow inserts the message into SQLite immediately with a provisional timestamp and enqueues for sync.
   3.2 On Firestore write acknowledgement (or when the message appears via the listener), set `status = sent` and record `serverCreatedAt`.
   3.3 Delivered: Mark as delivered when `state.delivery.lastDeliveredAt[recipientId] >= message.serverCreatedAt` for all recipients except the sender.
   3.4 Read: Mark as read when `state.read.lastReadAt[recipientId] >= message.serverCreatedAt` for all recipients except the sender.
   3.5 Prefer Firestore server timestamps when available and reconcile provisional values.

4. Presence
   4.1 Maintain online presence per user in Firestore (e.g., heartbeat or `lastActiveAt`) with a 30s heartbeat interval.
   4.2 Mirror presence into SQLite for UI rendering.

5. Typing Indicators
   5.1 Maintain per-conversation realtime state document in Firestore with `typing` for all participants.
   5.2 Apply a 5s TTL/timeout to typing signals to auto-clear stale indicators.
   5.3 Mirror typing state into SQLite via a single realtime listener for the active conversation.

6. Offline Behavior
   6.1 All writes operate against SQLite first and are queued as `sync_ops` for background flush.
   6.2 On reconnect, flush the outbox to Firestore with a minimal exponential backoff policy: 1s, 2s, 4s, 8s, 16s (max 5 attempts), then pause until the next reconnect event resets attempts.
   6.3 Merge remote changes into SQLite; Firestore values win on conflict.
   6.4 Error UI is silent in MVP (no banners/toasts); log for debugging only.

7. Routing
   7.1 `app/chat/[id].tsx` renders by local `conversationId` only.
   7.2 The `remoteId` is used strictly for sync; local IDs remain stable for routing.

8. Listener Strategy
   8.1 Attach one conversations-list listener scoped to the current user after auth.
   8.2 For the active conversation, attach exactly one messages listener and one realtime state listener (read/delivery/typing).
   8.3 Detach listeners when the user navigates away from the relevant screen.
   8.4 Hooks remain UI-only; do not attach Firestore listeners directly. They may signal the active conversation ID to the sync engine.

9. Data Model (SQLite → rendering source of truth)
   9.1 `users`: id, remoteId?, displayName, lastActiveAt, isOnline.
   9.2 `conversations`: id, remoteId?, createdAt, updatedAt.
   9.3 `participants`: conversationId, userId, role.
   9.4 `messages`: id, conversationId, senderId, text, createdAt, serverCreatedAt?, status('sent'|'delivered'|'read').
   9.5 `receipts`: conversationId, userId, lastReadAt.
   9.6 `typing`: conversationId, userId, isTyping, updatedAt.
   9.7 `sync_ops`: id, type, payload, createdAt, attemptCount, error?.

10. Data Model (Firestore → canonical)
   10.1 `users/{uid}`: displayName, lastActiveAt, online.
   10.2 `conversations/{remoteId}`: participantIds[], createdAt, updatedAt.
   10.3 `conversations/{remoteId}/messages/{remoteMsgId}`: senderId, text, createdAt.
   10.4 `conversations/{remoteId}/state` (single document):
        - `read.lastReadAt: { [userId]: Timestamp }`
        - `delivery.lastDeliveredAt: { [userId]: Timestamp }`
        - `typing: { [userId]: { isTyping: boolean, updatedAt: Timestamp } }`

#### Non-Goals (Out of Scope for this Epic)
- Push notifications.
- Media messages (text only).
- Profile pictures (display names only).
- Bootstrap/backfill beyond initial listener snapshots.
- Localization/i18n (English-only UI; default platform formatting; no i18n libraries).

#### Design Considerations
- Follow existing themed UI primitives (e.g., `ThemedText`, `ThemedView`, `ui/GlassCard`, `ui/GradientButton`).
- Ensure smooth scrolling and stable layout under frequent list updates.
- Respect safe areas and accessibility (touch targets, contrast, dynamic type where feasible).

#### Technical Considerations
- Client: Expo SDK 54; React Native 0.81; Expo Router v6; TypeScript strict.
- Local DB: Expo SQLite with schema as specified above; UI reads exclusively from SQLite.
- Backend: Firebase Auth; Firestore for messages/conversations/presence/typing/receipts; Cloud Functions optional for helpers (no push in this phase).
- Real-time: Firestore listeners; minimal, scoped per strategy.
- Conflict policy: Firestore wins; reconcile local provisional fields.
- Routing: `app/chat/[id].tsx` by stable local `conversationId`; `remoteId` used for sync only.
- Presence heartbeat: 30s interval.
- Typing TTL: 5s.
- Outbox retry/backoff: 1s, 2s, 4s, 8s, 16s; max 5 attempts; reset attempts on reconnect.
- Error UI: Silent in MVP; background retries only.
- Platforms: Must run on Expo Go (iOS/Android simulators/devices via Expo Go).

#### Success Metrics
- User A’s message appears on User B’s device within ~1s of send.
- Status transitions follow sent → delivered → read accurately.
- App remains crash-free during routine messaging flows.
- After force-quit/reopen, histories render from SQLite and syncing resumes without user action.

#### Open Questions
1. Server clock skew: Any guardrails to handle time drift vs. server timestamps?



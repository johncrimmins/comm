### Epic 1 — Messaging Core (Send A → appears on B)

Outcome
- Two signed-in users can exchange text messages in real-time.
- Messages are rendered from SQLite; Firestore is canonical.
- Status transitions: sent (ack), delivered (per-recipient marker), read (per-recipient read marker).

Scope
- Firebase Auth sign-in/out.
- SQLite schema: users, conversations, participants, messages, receipts, typing, sync_ops.
- Minimal listeners via sync engine:
  - Conversations list (user-scoped).
  - Active thread messages.
  - Active thread realtimeListener (state: read/delivery/typing).
- Local-first conversation creation; navigate to `app/chat/[id]` only after first send.
- Send text message → appears on the recipient device.

Acceptance
- User A sends text → User B’s device shows it within ~1s.
- `status=sent` after Firestore ack; delivered/read update as markers advance.
- No crashes; smooth scroll; consistent timestamps.


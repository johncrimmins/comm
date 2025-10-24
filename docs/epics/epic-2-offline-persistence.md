### Epic 2 — Offline Persistence (Messages persist locally)

Outcome
- Full chat history for active threads persists across app restarts.
- UI renders entirely from SQLite; remote data merges in via listeners.

Scope
- Ensure SQLite writes on all message sends and incoming message upserts.
- App relaunch shows prior conversations and last 100 messages per open thread.
- Indexes for fast queries; pagination for older messages on scroll.
- Background sync queue (`sync_ops`) with retry/backoff.

Acceptance
- Force-quit and reopen: recent threads and messages appear immediately from SQLite.
- Offline send persists locally; visible after relaunch; syncs on reconnect.


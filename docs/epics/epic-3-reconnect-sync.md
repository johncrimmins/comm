### Epic 3 — Reconnect Sync (Messages sync on reconnect)

Outcome
- Offline-queued messages flush and achieve sent/delivered/read states after connectivity returns.
- Remote activity while offline merges cleanly into SQLite on reconnect.

Scope
- Connectivity detection; trigger outbox flush.
- Idempotent Firestore writes for queued ops.
- Reconcile server timestamps; Firestore wins on conflicts.
- Ensure listeners reattach cleanly after reconnect.

Acceptance
- Go offline, send multiple messages, reconnect: all messages sync, timestamps reconcile, statuses update.
- Incoming messages received while offline appear post-reconnect with correct order and states.


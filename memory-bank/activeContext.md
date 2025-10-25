# Active Context

## Current Focus
- Implement Epic 1 — Messaging Core (real-time A→B messaging with local-first flow).

## Recent Changes
- PRD finalized at `docs/prd.md`:
  - Hooks are UI-only; sync engine owns Firestore listeners.
  - Single realtime listener (realtimeListener) per active conversation for read/delivery/typing.
  - No bootstrap/backfill in MVP; initial listener snapshots populate SQLite.
  - Navigate to `app/chat/[id]` only after first message send.
– Completed steps 1–5 of tasks for Epic 1:
  - 1.0 Firebase init + `useAuthUser` + minimal consumer.
  - 2.0 SQLite modularized under `lib/sqlite/*`; schema + DAOs + outbox + migrations.
  - 3.0 Sync engine (`lib/sync.ts`): conversations/messages/state listeners, presence heartbeat, backoff outbox.
  - 4.0 Services (`services/chat.ts`) SQLite-first: create/send/markRead/unread helpers.
  - 5.0 Hooks/UI wiring: `useConversations`, `useMessages`, local-first navigation, status display, typing/presence indicators.
– Migrated to Expo SQLite new API (`openDatabaseAsync`) and added compatibility exec wrapper.
– Added `metro.config.js` for web (wasm + COEP/COOP) per SDK 54 docs.
– ESLint/TS config updated so linter parses JSX and respects interop.

## Next Steps
- Validate step 6 scenarios and acceptance criteria across two devices; polish UI details.
- Add Jest tests for DAOs and services with module mocks.
- Decide whether to enable web now (keep Metro config) or defer real web persistence path.

## Active Decisions
- SQLite is the rendering source of truth; Firestore is canonical on conflicts.
- Statuses limited to sent, delivered, read.
- Listener strategy: conversations list (user-scoped) + active thread (messages + realtimeListener).
- Tech context updates only after completing each epic to avoid future-state drift.
- Maintain root-level `app/` structure; do not introduce a `src/` directory. Keep `@/*` alias mapped to project root.
– Use Expo SQLite new API (`openDatabaseAsync`) going forward; avoid legacy API. Web requires wasm + COEP/COOP headers.


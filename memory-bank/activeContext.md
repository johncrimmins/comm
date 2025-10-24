# Active Context

## Current Focus
- Implement Epic 1 — Messaging Core (real-time A→B messaging with local-first flow).

## Recent Changes
- PRD finalized at `docs/prd.md`:
  - Hooks are UI-only; sync engine owns Firestore listeners.
  - Single realtime listener (realtimeListener) per active conversation for read/delivery/typing.
  - No bootstrap/backfill in MVP; initial listener snapshots populate SQLite.
  - Navigate to `app/chat/[id]` only after first message send.

## Next Steps
- Implement minimal `lib/` scaffolding (`firebase.ts`, `sqlite.ts`, `sync.ts`) and `services/chat.ts` per PRD.
- Build `useConversations` and `useMessages` hooks as SQLite readers; signal active conversation to sync.
- Deliver Epic 1 acceptance criteria (A→B messaging, statuses, smooth UX).

## Active Decisions
- SQLite is the rendering source of truth; Firestore is canonical on conflicts.
- Statuses limited to sent, delivered, read.
- Listener strategy: conversations list (user-scoped) + active thread (messages + realtimeListener).
- Tech context updates only after completing each epic to avoid future-state drift.
- Maintain root-level `app/` structure; do not introduce a `src/` directory. Keep `@/*` alias mapped to project root.


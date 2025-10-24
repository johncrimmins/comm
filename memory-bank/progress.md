# Progress

## What works
- Memory Bank initialized with core files for Phase 1 context.

## What's left to build
- Firebase modules in `lib/firebase/*` (app, auth helpers, db).
- `services/chat.ts` with message subscription and send helper.
- Wire `hooks/useAuthForm.ts` to Firebase helpers and route on success.
- Update `app/chat/[id].tsx` to use Firestore-backed services.

## Current status
- Phase 1 is active and scoped to Auth + Firestore integration.

## Known issues
- None blocked yet; Firebase package is not yet installed.

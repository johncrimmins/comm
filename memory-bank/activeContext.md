# Active Context

## Current focus
Phase 1: Firebase Authentication + Firestore integration, per `docs/future-state.md` and `docs/phase-1-codex-spec.md`.

## Recent changes
- Initialized the Memory Bank with core files capturing goals, scope, and contracts for Phase 1.

## Next steps
- Create Firebase modules:
  - `lib/firebase/app.ts` (initialize with `EXPO_PUBLIC_*`)
  - `lib/firebase/auth.ts` (auth helpers: `onAuth`, `signIn`, `signUp`, `logOut`)
  - `lib/firebase/db.ts` (export Firestore `db`)
- Add chat services:
  - `services/chat.ts` with `onMessages(conversationId, cb)` and `sendMessage(conversationId, text, senderId)`
- Wire screens/hooks:
  - Update `hooks/useAuthForm.ts` to call Firebase helpers; on success, `router.replace('/(tabs)')`
  - Update `app/chat/[id].tsx` to subscribe to messages and send via `services/chat`

## Active decisions and considerations
- No offline persistence in Phase 1; defer to a later phase.
- No Android-specific changes (keyboard/layout) in Phase 1.
- Keep styling unchanged; prioritize isolated, reversible changes.
- Environment config via Expo public variables only; do not ship secrets.

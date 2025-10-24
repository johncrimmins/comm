# Project Brief

## Purpose
Introduce Firebase Authentication and Firestore-backed chat, replacing in-memory/mocked data while keeping the existing UI and routing intact. Changes must be small, isolated, reversible, and compatible with Expo Go and the web.

## Goals
- Initialize Firebase via the modular SDK in `lib/firebase/*` using `EXPO_PUBLIC_*` env vars.
- Wire email/password authentication through `hooks/useAuthForm.ts`.
- Read and write chat messages through a Firestore-backed services layer.
- Keep styling and layout unchanged; maintain clear boundaries for easy rollback.

## In Scope (Phase 1)
- `lib/firebase/app.ts`, `auth.ts`, `db.ts` for client initialization, auth, and Firestore access.
- `services/chat.ts` providing `onMessages()` and `sendMessage()`.
- Update `hooks/useAuthForm.ts` to call Firebase auth helpers.
- Update `app/chat/[id].tsx` to subscribe to Firestore messages and send via service.

## Out of Scope (Phase 1)
- Offline persistence (IndexedDB/AsyncStorage)
- Android-specific keyboard/layout changes
- Styling migrations/design system changes
- Navigation auth gates/guards

## Success Criteria
- App starts without Firebase initialization errors when `EXPO_PUBLIC_*` are set.
- Sign in/up executes and routes to `/(tabs)` successfully.
- Chat screen displays live Firestore messages for the current conversation id.
- Sending a message writes with a server timestamp and appears in the list.

## Risks and Constraints
- Client-only Firebase; no private keys or Admin SDK.
- Reversibility: ability to remove `lib/firebase/*` and `services/*` and revert screen hooks.

## Rollback Strategy
Delete `lib/firebase/*` and `services/*` and restore previous mock-driven logic in `hooks/useAuthForm.ts` and `app/chat/[id].tsx`.

## References
- See `docs/future-state.md` for target structure and contracts.
- See `docs/phase-1-codex-spec.md` for the implementation checklist and acceptance criteria.



# Project Brief

## Purpose
Build a modern, cross‑platform chat experience using Expo + React Native with file‑based routing, smooth animations, and polished theming. The app should run on iOS, Android, and Web with a single codebase.

## Goals
- Deliver clean navigation via Expo Router with typed routes.
- Provide elegant UI primitives (glass cards, gradients, themed components).
- Implement conversation flows: auth, contact selection, new conversation, and chat threads.
- Maintain strict TypeScript settings for reliability and clarity.
- Keep architecture simple and modular to evolve quickly.

## Scope
- Mobile and web clients built with Expo SDK 54 and React Native 0.81.
- Routing in `app/` using Expo Router v6; tabs and auth stacks.
- UI components in `components/` and hooks in `hooks/`.
- Local form/state management; no global state library in use yet.

## Non‑Goals (for now)
- Backend messaging service, real‑time sync, or push notifications.
- Offline persistence or complex caching.
- Deep analytics or A/B infrastructure.

## Success Criteria
- App boots on iOS, Android, and Web via `npx expo start`.
- Navigation flows work: auth → tabs → conversation → chat.
- UI demonstrates theming and motion (reanimated/gesture‑handler).
- TypeScript strict mode passes, and baseline tests run with Jest‑Expo.

## Key References
- Tech context and dependency versions: `memory-bank/techContext.md`
- Architecture and patterns: `memory-bank/systemPatterns.md`
- Active work and status: `memory-bank/activeContext.md`


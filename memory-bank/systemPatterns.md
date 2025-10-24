# System Patterns

## Architecture
- File‑based routing via Expo Router v6 (root-level `app/`; no `src/` directory):
  - Auth group: `app/(auth)/`
  - Tabs group: `app/(tabs)/`
  - Dedicated routes: `app/new-conversation.tsx`, `app/chat/[id].tsx`
- Strict TypeScript with path alias `@/*`.
- New Architecture enabled in `app.json` (`newArchEnabled: true`).

## Data & Sync (per PRD, MVP)
- SQLite is the UI source of truth; Firestore is canonical for conflicts.
- Local-first writes; background sync mirrors SQLite ↔ Firestore.
- Realtime listener (realtimeListener) per active conversation consolidates read/delivery/typing.
- Conversations list uses a single user-scoped listener.
- Hooks remain UI-only and read from SQLite; they may signal active conversation ID.

## Navigation
- React Navigation with bottom tabs and screens bridged by Expo Router.
- Typed route params enabled (`experiments.typedRoutes: true`).

## UI Composition
- Theming via `components/ThemedText.tsx` and `components/ThemedView.tsx`.
- Visual primitives: `ui/GlassCard`, `ui/GradientBackground`, `ui/GradientButton`.
- iOS‑specific symbols and tab background shims for polish.

## Forms & Validation
- Local hooks: `hooks/useAuthForm.ts`, `hooks/useFormValidation.ts` manage inputs and errors.
- `components/auth/*` provide labeled inputs and error text.

## Motion & Gestures
- `react-native-reanimated` v4 and `react-native-gesture-handler` v2 used for interaction and transitions.

## Testing & Linting
- Tests via Jest‑Expo preset.
- ESLint with `eslint-config-expo` and TypeScript strict settings.

## Assets
- Fonts (`assets/fonts/SpaceMono-Regular.ttf`) and images in `assets/images/`.

## Conventions
- Keep components small and composable with descriptive prop names.
- Prefer early returns and minimal nesting; avoid broad try/catch.
- Maintain accessible touch areas and safe‑area awareness.

## Important Notes
- Tech context should be updated only after each epic completes to reflect actual implemented state.


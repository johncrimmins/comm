# System Patterns

## Architecture
- File‑based routing via Expo Router v6 (root-level `app/`; no `src/` directory):
  - Auth group: `app/(auth)/`
  - Tabs group: `app/(tabs)/`
  - Dedicated routes: `app/new-conversation.tsx`, `app/chat/[id].tsx`
- Strict TypeScript with path alias `@/*`.
- New Architecture enabled in `app.json` (`newArchEnabled: true`).

## Data & Sync
- Firestore is the single source of truth
- Real-time listeners via Firestore `onSnapshot` for messages and state updates.
- Message delivery tracking via Firestore state documents (`conversations/{id}/state/state`).
- Conversations list uses Firestore real-time listener with in-memory sorting.
- Hooks read directly from Firestore; firestore handles offline persistence natively.

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

## Message Status Flow
- Sent: Set on Firestore write in `sendMessage`.
- Delivered: Auto-updated in `useMessages` when recipient receives message.
- Read: Updated via `markRead` when user opens chat.
- Status displayed only on current user's own messages.

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


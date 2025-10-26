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
- Message delivery tracking via arrays in message documents (deliveredTo, readBy).
- Conversations list uses Firestore real-time listener with in-memory sorting.
- Hooks read directly from Firestore.
- App lifecycle: AppState listener in chat screen updates presence on foreground.

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
- Sent: Set on Firestore write in `sendMessage` with deliveredTo: [senderId]
- Delivered: Marked via markDelivered() when message arrives or user opens app
- Read: Marked via markRead() when user opens chat (adds userId to readBy array)
- Status calculated from array lengths: read if readBy.length > 1, delivered if deliveredTo.length > 1
- Status displayed only on current user's own messages
- Arrays stored directly in message documents: `conversations/{id}/messages/{msgId}` with deliveredTo and readBy

## Presence System
- Presence tracked via `users/{userId}` document with `lastSeen` timestamp
- Online threshold: within 30 seconds of current time
- Updated on chat open and app foreground via `updatePresence`
- Real-time listeners via `usePresence` hook for 1-on-1 and group chats
- Typing status tracked via `currentlyTypingIn` field in user documents
- Typing auto-clears after 3 seconds of inactivity
- Displays "typing..." in chat header when other user is typing

## Notifications
- Foreground-only notifications via `expo-notifications` (Expo Go compatible)
- `useNotifications` hook listens to all conversations except current one
- Uses `docChanges()` to detect truly new messages vs initial load
- First load initializes timestamp, subsequent loads only notify on new additions
- Platform check: skips web (notifications not supported), works on iOS/Android
- Only notifies for messages from other users (not own messages)
- Configured in `app/_layout.tsx` with full alert/sound/badge support
- Comprehensive logging for debugging notification flow

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


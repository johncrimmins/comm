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
- Root layout uses `<SafeAreaProvider>` wrapping entire app.
- Stack navigator with `screenOptions={{ headerShown: false }}` for consistent header hiding.
- All screens registered unconditionally in Stack for proper Expo Router integration.

## UI Composition
- Theming via `components/ThemedText.tsx` and `components/ThemedView.tsx`.
- Visual primitives: `ui/GlassCard`, `ui/GradientBackground`, `ui/GradientButton`.
- iOS‑specific symbols and tab background shims for polish.
- Safe area handling: Use `SafeAreaView` from `react-native-safe-area-context` with edges prop.
- Platform checks: Conditional rendering for web vs native (e.g., KeyboardAvoidingView).

## Safe Area Patterns
- Root: `<SafeAreaProvider>` wraps entire app in `app/_layout.tsx`.
- Tabs screen: `edges={['top', 'right']}` for status bar and right-side protection.
- Chat screens: `edges={['top']}` for status bar only.
- New conversation: `edges={['top']}` for status bar only.
- Padding strategy: Use `paddingLeft`/`paddingRight` instead of `paddingHorizontal` for asymmetric spacing.

## Reusable Components
- `ChatInput`: Used in both chat screen and new-conversation screen for consistency.
- `ChatHeader`: Displays conversation title and presence status.
- `ChatMessages`: Handles message list rendering with FlatList.
- `GlassCard`: Themed container with blur effect and dark theme.
- Components located in `components/` directory organized by feature (auth, chat, conversation, ui).

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

## Platform-Specific Handling
- KeyboardAvoidingView: Only used on iOS/Android, not web (web renders input directly)
- Safe area edges: Configure per screen based on layout needs
- Platform checks: Use `Platform.OS === 'ios' || Platform.OS === 'android'` for native-only features
- Web rendering: Avoid components that interfere with browser behavior (like KeyboardAvoidingView)

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
- Use Platform checks for cross-platform compatibility.
- Prefer reusable components over duplicate code.

## Important Notes
- Tech context should be updated only after each epic completes to reflect actual implemented state.
- Always use SafeAreaView with appropriate edges rather than manual padding for safe areas.
- Export hooks and components consistently for reusability across screens.

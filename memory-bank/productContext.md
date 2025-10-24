# Product Context

## Why This Exists
Provide a sleek, fast chat UI that feels native, showcases modern RN/Expo patterns, and can later integrate with a real messaging backend.

## Problems Addressed
- Fragmented patterns across RN projects → establish clear, typed routing and component structure.
- UI inconsistency → consolidated themed components and reusable primitives.
- Slow iteration → Expo dev tooling and strict TS reduce regressions.

## How It Should Work (High Level)
- Users authenticate, land in a tabbed interface, start new conversations, and exchange messages.
- Conversations and messages render with polished visuals (glass/gradient backgrounds) and responsive layouts.
- Routes are file‑based with typed params; navigation is predictable and testable.

## User Experience Goals
- Fast startup, smooth transitions, intuitive gestures.
- Consistent theming via `ThemedText`/`ThemedView` and color tokens.
- Accessible touch targets and safe‑area handling out‑of‑the‑box.

## Notable Screens/Flows Present
- Auth screens in `app/(auth)/`.
- Tabbed home in `app/(tabs)/`.
- New conversation: `app/new-conversation.tsx` with chips/components.
- Chat thread: `app/chat/[id].tsx` with `components/chat/Message.tsx`.


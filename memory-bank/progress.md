# Progress

## What Works
- Firebase authentication and user profiles.
- Real-time messaging via Firestore listeners.
- Message delivery states (sent/delivered/read) working.
- Display names and avatars in chat messages.
- Group chat support (3+ users).
- Conversation list with real-time updates.
- Read receipts when opening chat.
- Online/offline presence indicators (via lastSeen timestamp).
- Group chat presence showing online count and total members.

## What's Left To Build
- Typing indicators.
- Push notifications.
- Presence updates on app background/foreground.
- Robust error handling and retry logic.

## Current Status
- Firestore-first architecture working.
- MVP messaging core complete.
- Presence indicators implemented and working.

## Known Issues
- No offline persistence beyond Firestore's offline cache.
- Typing indicators not implemented.
- Presence updates may not work reliably in all app states.


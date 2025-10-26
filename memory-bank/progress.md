# Progress

## What Works
- Firebase authentication and user profiles
- Real-time messaging via Firestore listeners
- Message delivery states (sent/delivered/read) working with arrays
- Display names and avatars in chat messages
- Group chat support (3+ users)
- Conversation list with real-time updates
- Read receipts when opening chat
- Online/offline presence indicators (via lastSeen timestamp)
- Group chat presence showing online count and total members
- Presence updates on app foreground/background
- Typing indicators showing "typing..." in chat header
- Auto-clear typing after 3 seconds of inactivity
- Foreground notifications for new messages in other conversations (expo-notifications)

## What's Left To Build
- Robust error handling and retry logic
- Improved offline support beyond Firestore cache

## Current Status
- Firestore-first architecture working
- MVP messaging core complete with delivery states
- Presence and typing indicators implemented and working

## Known Issues
- No offline persistence beyond Firestore's offline cache
- Presence updates may not work reliably in all app states


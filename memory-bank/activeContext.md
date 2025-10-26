# Active Context

## Current Focus
- Test foreground notifications in Expo Go

## Recent Changes
- Foreground notifications implemented (commit efdf0d6): expo-notifications with useNotifications hook
- Typing indicators implemented (commit 7e791f6): user document approach with setTyping/clearTyping
- Message delivery states refactored (commit 6002cf4): arrays-based approach with deliveredTo/readBy
- Presence system: lastSeen tracking, typing status in user documents
- Display names and avatars in messages
- Firestore as single source of truth with native offline persistence

## Next Steps
- Test notification delivery for new messages on tabs screen
- Robust error handling and retry logic
- Improved offline support beyond Firestore cache

## Active Decisions
- Firestore is single source of truth with native offline persistence
- Message statuses: sent (on send), delivered (on app open + receipt), read (on chat open)
- Status tracked via deliveredTo and readBy arrays in message documents
- Typing status tracked via currentlyTypingIn field in user documents
- Status only shown on current user's own messages
- Presence via lastSeen timestamp (online if within 30 seconds)
- Group chat presence shows "X online · Y members" format
- Typing shows "typing..." when other user is typing in same conversation
- Notifications: foreground-only, skip web platform, skip current conversation, only new messages via docChanges


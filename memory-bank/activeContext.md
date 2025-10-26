# Active Context

## Current Focus
- Firestore-first architecture with presence and delivery states

## Recent Changes
- Presence system added (commit 1d62e67): lastSeen tracking via Firestore users collection
- Display names and avatars in messages (commit 8972d5f)
- Removed iOS/Android native packages; Expo Go only (commit 41239ad)
- Firestore as single source of truth, removed SQLite (commit 96cffe7)
- User profiles with deterministic avatar colors and display names

## Next Steps
- Implement typing indicators
- Add push notifications support
- Test presence indicators with multiple users

## Active Decisions
- Firestore is single source of truth with native offline persistence
- Message statuses: sent (on send), delivered (on receipt), read (on markRead)
- Status only shown on current user's own messages
- Presence via lastSeen timestamp (online if within 30 seconds)
- Group chat presence shows "X online · Y members" format
- Typing indicators not yet implemented


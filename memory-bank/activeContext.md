# Active Context

## Current Focus
- Firestore-first architecture

## Recent Changes
- Added display names and avatars to chat messages (commit 8972d5f).
- Removed iOS/Android native packages; using Expo Go only (commit 41239ad).
- Complete refactor to Firestore as source of truth (commit 96cffe7).
- Implemented sent/delivered/read status tracking via Firestore state documents (commit cdf79b7).
- User profiles with deterministic avatar colors and display names.
- Real-time message delivery and status updates working.

## Next Steps
- Implement typing indicators.
- Add push notifications support.
- Test presence indicators with multiple users.

## Active Decisions
- Firestore is the single source of truth and handles offline persistence locally natively.
- Message statuses: sent, delivered, read.
- Status only shown on current user's own messages.
- Presence implemented via lastSeen timestamp (online if within 30 seconds).
- Group chat presence shows "X online · Y members" format.
- Typing indicators not yet implemented.


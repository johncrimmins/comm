# Active Context

## Current Focus
- Cross-platform UI consistency and safe area handling
- Web platform support optimization

## Recent Changes
- UI overflow fixes (commit c4b9410): Fixed tabs screen safe area edges and padding
- Component refactoring (commit f3b230b): Replaced custom input in new-conversation with reusable ChatInput component
- Web keyboard input fixed (commit f3b230b): Added Platform check to ChatInput for web support
- Navigation fix (commit f3b230b): Always navigate to chat screen after sending from new conversation
- Code cleanup: Removed dead useAuth.tsx file (Context-based version never integrated)
- Removed duplicate code: Consolidated ~70 lines of duplicate input styles
- Foreground notifications implemented (commit efdf0d6): expo-notifications with useNotifications hook
- Typing indicators implemented (commit 7e791f6): user document approach with setTyping/clearTyping
- Message delivery states refactored (commit 6002cf4): arrays-based approach with deliveredTo/readBy
- Presence system: lastSeen tracking, typing status in user documents
- Display names and avatars in messages
- Firestore as single source of truth with native offline persistence

## Next Steps
- Investigate iPhone input area visibility issues
- Add Platform-specific KeyboardAvoidingView handling to more components if needed
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
- Safe area handling: Use edges=['top', 'right'] for tabs screen, ['top'] for other screens
- Platform checks: KeyboardAvoidingView only on iOS/Android, not web
- Reusable components: ChatInput used across chat and new-conversation screens for consistency

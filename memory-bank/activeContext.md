# Active Context

## Current Focus
- AI conversation feature complete
- Future: Multiple AI agent types (Summarize, Detect Actions, Track Decisions, Scheduler)

## Recent Changes
- AI conversation feature implemented: Sticky header for "Chat with Comms (AI)", separate aiChat service, auto-creation on signup, OpenAI integration for responses
- Fixed AI chat to use dedicated chatWithAI function instead of transformText, separated transformation vs chat logic, temperature set to 0.4 for consistent responses
- Created services/aiPrompts.ts: Centralized AI system prompt configuration with placeholders for future agent types
- Created services/aiChat.ts: Wraps chat and OpenAI services for AI-specific message handling
- Updated lib/firebase/auth.ts: Auto-creates AI conversation for new users during signup
- Updated app/(tabs)/index.tsx: Added sticky AI conversation header outside FlatList
- Updated app/chat/[id].tsx: Detects AI conversations and uses aiChat service for message handling
- Updated hooks/useConversations.ts: Filters out AI conversations from regular list
- Updated hooks/useMessages.ts: Adds special handling for 'ai-assistant' sender
- Text transformations refactored (commit 25e1f8c): Dynamic popover supporting multiple transformations (Concise, Professionalize, Technicalize)
- Transformation service pattern: Created services/messageTransformations.ts for centralized transformation definitions
- Generic OpenAI API: Refactored services/openai.ts to accept any system prompt via transformText function
- Dynamic button rendering: ChatInput maps over transformations array for scalable UI
- Stacked button styling: Multiple transformation buttons with proper border radius (rounded top/bottom)
- Long-press concise feature (commit 4788c8d): OpenAI integration with GPT-4o-mini for message conciseness
- Gesture handler implementation: LongPressGestureHandler on send button with state flag to prevent accidental sends
- Popover UI with Reanimated animations: iMessage-style spring animations for transformation options
- OpenAI service layer: Created services/openai.ts following Firebase environment variable pattern
- Tap-outside-to-dismiss: Overlay-based dismiss functionality for popover
- Code cleanup: Removed all console.log statements across app
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
- Future simplification: Refactor to support multiple AI agent types (Summarize Comms, Detect Actions from Comms, Track Decisions from Comms, Scheduler Comms)
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
- Gesture patterns: Use LongPressGestureHandler wrapped around TouchableOpacity with state flag to prevent unintended actions
- Environment variables: Use EXPO_PUBLIC_ prefix for client-accessible variables (Firebase, OpenAI)
- OpenAI integration: GPT-4o-mini model with 0.3 temperature for consistent transformation results
- Transformation architecture: Centralized transformation definitions in services/messageTransformations.ts, generic API wrapper in services/openai.ts
- Dynamic UI patterns: Map over configuration arrays to render reusable UI components (transformations, buttons, etc.)
- Service layer separation: Keep transformation definitions separate from API implementation for maintainability
- AI conversations: Create AI conversation during signup, use separate aiChat service for AI-specific logic, detect via participantIds including 'ai-assistant'
- Sticky UI patterns: Render AI conversation outside FlatList for sticky positioning, regular conversations scroll below

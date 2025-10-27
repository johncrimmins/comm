# Active Context

## Current Focus
- Noir + Amber theme: Minimal, professional design with amber accents on black background
- Centralized styling system: Approach 1 implementation for rapid style iteration
- TalkTime-inspired navigation: Pill-shaped nav bar with floating icons
- Swipe-to-delete functionality: Gesture-based conversation deletion
- Designer-level refinements: Clean, precise typography and spacing

## Recent Changes
- Added get_decisions tool: Extract key decisions from conversations via n8n webhook at /get-decisions
- Added pull_actions tool: Extract action items from conversations via n8n webhook at /pull-actions
- Conversation titles implemented: Signup form includes title field, stored in Firestore conversation documents
- Code refactoring: Extracted resolveConversationId() and personalizeResponse() helper functions in services/openai.ts
- OpenAI service simplified: Reduced tool handlers from ~110 lines to ~40 lines each using shared helpers
- n8n webhook paths: Updated to use base URL + path pattern (/summarize, /pull-actions, /get-decisions)
- Updated AI prompt: Added keywords for detecting action items and decisions requests
- Code refactoring (commit d2f1c5c): Extracted message status logic to utils/messageStatus.ts, reduced useMessages.ts by 13 lines
- Code refactoring (commit d2f1c5c): Extracted conversation search logic to utils/conversationHelpers.ts, reduced n8n.ts by 69 lines
- Architecture documentation: Created comprehensive docs/ai-chat-architecture-analysis.md mapping all data flows
- Type safety: Added types/api.ts with TypeScript interfaces for OpenAI and n8n responses
- Code quality: Added detailed inline comments to services/openai.ts, services/aiChat.ts, services/n8n.ts
- Utility extraction: Created pure function utilities for message status calculation and conversation search
- Conversation search by participant name: Implemented findConversationByParticipant() in services/n8n.ts
- Prefer 1-on-1 conversations: Search logic prioritizes 1-on-1 chats over group chats when searching by name
- OpenAI tool updated: Now accepts optional conversationId OR participantName parameters
- Search logic: Filters conversations by current user participation (security built-in)
- Tool execution enhanced: Automatically searches for conversations when user mentions a name
- User display name in n8n: summarizeConversation() now fetches and passes userName to n8n webhook
- Summary personalization: App sends userName and participantNames to n8n, n8n uses names in summary, app replaces userName with "You" for natural conversation
- User ID to name mapping: participantNames map sent to n8n for intelligent summarization with display names
- Conversation names implemented: useConversations now displays participant names instead of "conversation 1, 2, 3"
- Name formatting: Shows "John", "John & Jane", or "John, Jane & 2 more" based on participant count
- Production webhook activated: Summarize workflow now running in production mode
- Improved error handling: Returns helpful message when conversation not found
- RAG integration working: Conversation summarization working end-to-end via n8n webhooks
- OpenAI tool calling: AI detects "summary" keywords and calls n8n to summarize conversations
- n8n webhook integration: Handles array response format, extracts summary from data[0].summary
- Fixed CORS issues: Removed Content-Type header to avoid preflight OPTIONS requests
- Added comprehensive logging for debugging webhook calls and response handling
- Conversation history: Fetches last 10 messages (user + AI only) and passes to OpenAI for context
- Tool calling pattern: OpenAI → tool call → n8n webhook → Firebase → summary → OpenAI final response
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
1. Fine-tune styling iterations using centralized system
2. Future: Additional tool calls (next steps, meeting notes, key takeaways)
3. Store tool outputs in Firestore for caching
4. Continue refining UI for professional polish
5. Robust error handling and retry logic
6. Improved offline support beyond Firestore cache

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
- RAG integration: OpenAI tool calling for conversation summarization, n8n webhooks for RAG pipeline execution
- Conversation history: Last 10 messages fetched from Firestore and filtered to user + AI only
- Tool calling pattern: AI detects keywords and calls appropriate n8n webhook (summarize, pull_actions, get_decisions)
- Three AI tools implemented: summarize_conversation, pull_actions, get_decisions
- Tool handlers use shared helpers: resolveConversationId() and personalizeResponse() reduce duplication
- n8n webhook paths: Base URL + path pattern ({baseUrl}/summarize, {baseUrl}/pull-actions, {baseUrl}/get-decisions)
- n8n response formats: Array responses [{summary: "..."}, {actions: "..."}, {decisions: "..."}]
- Conversation titles: Optional title field in Firestore conversations, set during signup for AI conversations
- CORS handling: Removed Content-Type header to avoid preflight OPTIONS requests (n8n doesn't support OPTIONS)
- Environment variables: EXPO_PUBLIC_N8N_WEBHOOK_URL for n8n webhook base URL
- Centralized styling: Implemented Approach 1 with theme.ts, styles/screens/, styles/components/ for rapid iteration
- Noir + Amber theme: Deep black backgrounds (#0B0B0B) with amber accents (#F59E0B), flat design (no gradients/blur)
- Designer refinements: Removed card borders, cleaner typography, refined spacing (20px horizontal, 8px gaps)
- Swipe-to-delete: Gesture-based conversation deletion with red delete button, AI conversation protected
- TalkTime nav bar: Pill-shaped with rounded top corners (20px), floating icons, 72px height, dark active state
- Profile screen: New tab for user profile with email display and avatar

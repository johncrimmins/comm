# AI Chat Architecture Analysis

## Overview
This document maps the complete data flows for the AI chat system (excluding long-press text transformations) and identifies refactoring opportunities.

## AI Chat Data Flow

### 1. User Message Flow

```
app/chat/[id].tsx (handleSend)
  ↓
services/aiChat.ts (sendAIMessage)
  ├─→ services/chat.ts (sendMessage) → Firestore write
  ├─→ Fetch conversation history (last 10 messages, user + AI only)
  ├─→ services/openai.ts (chatWithAI)
  │   ├─→ OpenAI API with system prompt + history + tools
  │   ├─→ Tool detection (if keywords like "summary" detected)
  │   │   ├─→ services/n8n.ts (summarizeConversation)
  │   │   │   └─→ n8n webhook → Firebase fetch → summary
  │   │   └─→ Return tool results to OpenAI
  │   └─→ Final AI response
  └─→ services/chat.ts (sendMessage) → Store AI response in Firestore
```

### 2. Conversation Detection Flow

```
app/chat/[id].tsx
  ├─→ hooks/useConversation.ts → Fetch conversation data
  ├─→ services/aiChat.ts (isAIConversation)
  │   └─→ Check if participantIds includes 'ai-assistant'
  └─→ Route message handling to appropriate service
```

### 3. AI Conversation Creation Flow

```
lib/firebase/auth.ts (ensureUserProfile)
  ├─→ On new user signup
  └─→ services/chat.ts (createOrFindConversation)
      └─→ Creates conversation with participantIds: [userId, 'ai-assistant']
```

### 4. Display Flow

```
app/(tabs)/index.tsx
  ├─→ Fetch AI conversation separately
  ├─→ Display as sticky header outside FlatList
  └─→ Filter out AI conversations from useConversations() hook
```

## File Structure & Responsibilities

### Services Layer (`services/`)

**services/aiChat.ts** (90 lines)
- Orchestrates AI conversation flow
- Calls `sendMessage` to store user message
- Fetches conversation history from Firestore
- Calls `chatWithAI` with conversation context
- Stores AI response back to Firestore
- Contains `isAIConversation()` detection logic

**services/openai.ts** (364 lines)
- `transformText()`: Text transformations (concise, professionalize, technicalize)
- `chatWithAI()`: Conversational AI with tool calling support
- Tool execution logic (summarize_conversation)
- Handles OpenAI API communication
- Environment variable: `EXPO_PUBLIC_OPENAI_API_KEY`

**services/n8n.ts** (164 lines)
- `summarizeConversation()`: Calls n8n webhook for conversation summarization
- `findConversationByParticipant()`: Searches Firebase for conversations by participant name
- Environment variable: `EXPO_PUBLIC_N8N_WEBHOOK_URL`
- Handles n8n response parsing (array format: `[{summary: "..."}]`)

**services/chat.ts** (160 lines)
- `createOrFindConversation()`: Creates or finds existing conversation
- `sendMessage()`: Writes message to Firestore with status tracking
- `markDelivered()`: Updates message delivery status
- `markRead()`: Updates message read status
- `markConversationsDelivered()`: Bulk delivery marking

**services/aiPrompts.ts** (43 lines)
- Centralized AI system prompt configuration
- Defines `AI_SYSTEM_PROMPTS` object
- Provides `getAISystemPrompt()` helper
- Currently only has 'default' prompt; placeholders for future agents

**services/messageTransformations.ts** (29 lines)
- Transformation definitions for long-press feature
- Used only by `components/chat/ChatInput.tsx`
- NOT part of AI chat flow (user mentioned to ignore long-press features)

**services/presence.ts** (60 lines)
- `updatePresence()`: Updates user's lastSeen timestamp
- `setTyping()`: Sets typing status in user document
- `clearTyping()`: Clears typing status

### Hooks Layer (`hooks/`)

**hooks/useMessages.ts** (144 lines)
- Real-time Firestore listener for messages
- Fetches user names/avatars for display
- Handles message status calculation (sent/delivered/read)
- Special handling for 'ai-assistant' sender
- Marks messages as delivered/read on receipt

**hooks/useConversations.ts** (136 lines)
- Real-time Firestore listener for conversations
- Filters out AI conversations (shown separately as sticky header)
- Generates display names from participant names
- Fetches last message for each conversation
- Sorts by last message timestamp

**hooks/useConversation.ts** (38 lines)
- Real-time listener for single conversation
- Returns conversation metadata (participantIds, timestamps)

**hooks/useAuth.ts** (15 lines)
- Simple wrapper for Firebase auth user state

**hooks/usePresence.ts** (106 lines)
- Real-time listener for user presence
- Tracks online/offline status (30-second threshold)
- Tracks typing indicators
- Calculates presence text for chat header

**hooks/useNotifications.ts** (110 lines)
- Foreground notifications for new messages
- Only triggers for conversations OTHER than current one
- Uses `docChanges()` to detect new messages vs initial load
- Platform check: skips web

**hooks/useUsers.ts** (Unknown - not read)
- Likely fetches user list for contact selection

### Components Layer (`components/`)

**components/chat/ChatInput.tsx** (276 lines)
- Input field with send button
- Long-press gesture handler for transformations
- Transformation popover UI
- Used in both `app/chat/[id].tsx` and `app/new-conversation.tsx`
- NOT handling AI chat logic (delegates to parent's onSend)

**components/chat/ChatHeader.tsx** (Unknown - not read)
- Displays conversation title and presence status

**components/chat/ChatMessages.tsx** (Unknown - not read)
- FlatList wrapper for messages

**components/chat/Message.tsx** (173 lines)
- Individual message bubble component
- Displays sender name, avatar, timestamp, status
- Handles AI assistant display (`'Comms (AI)'`)

### App Layer (`app/`)

**app/chat/[id].tsx** (188 lines)
- Main chat screen
- Detects AI vs regular conversation
- Routes to `sendAIMessage()` or `sendMessage()` based on type
- Manages typing indicators
- Handles presence updates
- Message state management

**app/(tabs)/index.tsx** (333 lines)
- Conversation list screen
- Displays AI conversation as sticky header
- Filters AI conversations from list
- Manages app-level delivery marking

**app/new-conversation.tsx** (229 lines)
- New conversation creation screen
- Uses `ChatInput` component
- Creates conversation via `createOrFindConversation()`
- Sends first message and navigates to chat

**lib/firebase/auth.ts** (58 lines)
- Authentication management
- Auto-creates AI conversation on signup
- User profile management

## Data Flows Summary

### Regular Messages (Non-AI)
1. User types message in `ChatInput`
2. `app/chat/[id].tsx` calls `sendMessage(conversationId, text, userId)`
3. Message written to Firestore: `conversations/{id}/messages/{msgId}`
4. Real-time listener in `useMessages` updates UI
5. Other participants' clients receive update via Firestore listener

### AI Messages (AI Conversation)
1. User types message in `ChatInput`
2. `app/chat/[id].tsx` detects AI conversation via `isAIConversation()`
3. Calls `sendAIMessage(conversationId, text, userId)`
4. User message stored in Firestore via `sendMessage()`
5. `sendAIMessage()` fetches last 10 messages (user + AI only)
6. Calls `chatWithAI()` with history + system prompt + tools enabled
7. OpenAI may call tools (e.g., `summarize_conversation`) if keywords detected
8. Tool calls n8n webhook, which fetches from Firebase and returns summary
9. OpenAI processes tool results and generates final response
10. AI response stored in Firestore via `sendMessage()` with senderId: 'ai-assistant'
11. Real-time listener updates UI with AI response

### Tool Calling Flow (Summarization)
1. User asks AI to summarize a conversation
2. OpenAI detects "summary" keyword in user message
3. Calls `summarize_conversation` tool with optional `conversationId` or `participantName`
4. If `participantName` provided, `findConversationByParticipant()` searches Firebase
5. `summarizeConversation()` calls n8n webhook with `{conversationId, userId}`
6. n8n fetches messages from Firebase and generates summary via OpenAI
7. Returns summary to client: `[{summary: "..."}]`
8. Summary personalized (userId → names, current user → "You")
9. Tool result sent back to OpenAI
10. OpenAI generates final response with summary

## Refactoring Opportunities

### 1. Separation of Concerns

**services/openai.ts** (364 lines) - Too large and handles multiple responsibilities
- **Issue**: Contains both transformation logic (`transformText`) and chat logic (`chatWithAI`)
- **Solution**: Split into:
  - `services/openai.ts` - Base OpenAI API wrapper
  - `services/openaiTransform.ts` - Text transformation logic
  - `services/openaiChat.ts` - Chat-specific logic (could be merged with aiChat.ts)

**services/aiChat.ts** - Could consolidate with OpenAI chat logic
- **Current**: Orchestrates AI conversation flow
- **Opportunity**: Merge `chatWithAI()` logic directly into `sendAIMessage()` since it's only used there
- **Benefit**: Reduces indirection and file hopping

**services/n8n.ts** - Tool execution could be moved
- **Current**: Contains both webhook calling and conversation search
- **Suggestion**: Keep webhook calling in n8n.ts, move search logic to a `services/conversationSearch.ts` utility

### 2. Dead Code to Remove

**components/chat/ChatInput.tsx** - Transformation logic
- **Status**: The long-press transformation feature is NOT part of AI chat
- **User request**: User asked to ignore long-press features
- **Files involved**:
  - `services/messageTransformations.ts` - Transformation definitions
  - `services/openai.ts` - `transformText()` function (lines 36-90)
  - `components/chat/ChatInput.tsx` - Transformation UI (lines 8, 28-87, 145-165)
- **Recommendation**: Keep these files for now since they're working features, but they're not part of AI chat flow

**No actual dead code found** - All imported files are actively used

### 3. Code Organization Improvements

**Tool calling logic in services/openai.ts** (lines 186-347)
- **Issue**: Large inline implementation of tool execution
- **Solution**: Extract to `services/openaiTools.ts` or move to `services/aiChat.ts`
- **Benefit**: Better separation of concerns

**Conversation search logic in services/n8n.ts** (lines 32-102)
- **Issue**: Mixes webhook calling with search logic
- **Solution**: Move `findConversationByParticipant()` to `services/conversationSearch.ts`
- **Benefit**: Cleaner file organization

**Message status calculation in hooks/useMessages.ts** (lines 102-113)
- **Issue**: Status logic embedded in hook
- **Solution**: Extract to utility function in `services/chat.ts` or `utils/messageStatus.ts`
- **Benefit**: Reusable and testable

### 4. Type Safety Improvements

**Missing TypeScript types**
- OpenAI API responses (lines 178-184 in openai.ts use `any`)
- n8n webhook responses (lines 141-149 in n8n.ts parse without type safety)
- Tool call parameters (lines 196-197 use `JSON.parse` without type guards)

**Recommendation**: Add proper TypeScript interfaces for all API responses

### 5. Error Handling Consolidation

**Inconsistent error handling**
- Some services throw errors, others fail silently
- `services/presence.ts` - Silent failures (lines 15, 29, 34)
- `services/chat.ts` - Throws errors (lines 60-62)
- `services/n8n.ts` - Throws errors (lines 109, 160)

**Recommendation**: Create consistent error handling pattern across all services

## Safe Refactoring Plan (No Breaking Changes)

### ⚠️ CRITICAL: Zero-Downtime Approach

All refactoring must maintain 100% backward compatibility. Each change must be independently deployable and testable.

### Phase 1: Documentation & Understanding (SAFE)
**Goal**: Document current state without changing any code
- ✅ Complete architecture mapping (this document)
- ✅ Data flow diagrams
- ✅ File responsibility documentation
- **Risk**: None - only adds documentation
- **Testing**: No code changes

### Phase 2: Type Safety Additions (SAFE - Additive Only)
**Goal**: Add type definitions without changing runtime behavior
1. Create `types/api.ts` with TypeScript interfaces:
   - `OpenAIResponse`, `OpenAIToolCall`, `N8NResponse`
   - Export alongside existing `any` types
2. Gradually replace `any` with proper types in isolated functions
3. Use type assertions only where necessary
- **Risk**: Low - only adds type information
- **Testing**: TypeScript compilation check
- **Rollback**: Remove type file if issues

### Phase 3: Utility Extraction (SAFE - New Files Only)
**Goal**: Extract reusable logic into new utility files
1. Create `utils/messageStatus.ts`:
   - Extract status calculation logic from `hooks/useMessages.ts`
   - Keep original implementation unchanged
   - Export as pure function
2. Create `utils/conversationHelpers.ts`:
   - Move `findConversationByParticipant()` from `services/n8n.ts`
   - Keep original in n8n.ts, re-export from utils
   - Update imports gradually
- **Risk**: Low - adds new files without modifying existing ones
- **Testing**: Verify utility functions work independently
- **Rollback**: Delete utility files

### Phase 4: Additive Refactoring (SAFE - Side-by-Side)
**Goal**: Create new implementations alongside old ones
1. Create `services/openaiChat.ts` (new file):
   - Copy `chatWithAI()` to new file with improved types
   - Keep original unchanged
   - Update imports in one file at a time, test, then remove old
2. Create `services/openaiTransform.ts` (new file):
   - Copy `transformText()` to new file
   - Keep original unchanged
   - Gradually migrate consumers
- **Risk**: Medium - requires careful import management
- **Testing**: Full regression test after each import change
- **Rollback**: Revert import changes

### Phase 5: Verification & Cleanup (After All Phases Stable)
**Goal**: Remove old implementations only after validation
1. Remove old implementations from `services/openai.ts`
2. Consolidate all utilities
3. Update all imports
- **Risk**: High - requires all previous phases stable
- **Testing**: Comprehensive test suite
- **Rollback**: Git revert entire phase

## Conservative Approach Recommendations

### ✅ DO THESE (Safe, Incremental)
1. **Add type definitions** - No runtime impact
2. **Extract utilities** - New files, old code untouched
3. **Add inline comments** - Improve readability
4. **Create helper functions** - Keep alongside existing code
5. **Write unit tests** - Document expected behavior

### ❌ AVOID THESE (High Risk)
1. **Merge functions** - Changes call sites
2. **Rename files** - Breaks imports
3. **Change function signatures** - Breaks callers
4. **Restructure directories** - Breaks module resolution
5. **Modify error handling** - Changes behavior

### First Safe Steps (Can Do Immediately)
1. Add TypeScript interfaces to `types/api.ts`
2. Extract message status logic to `utils/messageStatus.ts`
3. Extract conversation search to `utils/conversationHelpers.ts`
4. Add JSDoc comments to complex functions
5. Document function dependencies in comments

## Testing Requirements for Any Refactoring

### Before Any Change
- [ ] Write test cases for current behavior
- [ ] Document all call sites for functions being modified
- [ ] Create integration test for AI chat flow

### During Change
- [ ] Test each file independently after modification
- [ ] Verify all imports still resolve
- [ ] Check TypeScript compilation
- [ ] Manual test of AI conversation
- [ ] Manual test of tool calling (summarization)

### After Change
- [ ] Full regression test of chat functionality
- [ ] Test AI chat end-to-end
- [ ] Test n8n webhook integration
- [ ] Test conversation search
- [ ] Test regular (non-AI) chat

## Recommended Starting Point (Safest First Steps)

1. **Create `types/api.ts`** with interfaces (no changes to existing code)
2. **Create `utils/messageStatus.ts`** with helper function (new file only)
3. **Add comments** to complex functions explaining flow
4. **Document** function dependencies in comments

These steps add value without any risk of breaking existing functionality.

## External Integrations

### OpenAI API
- **Model**: GPT-4o-mini
- **Temperature**: 0.3 (transformations), 0.4 (chat)
- **Max tokens**: 500
- **Tool calling**: Enabled for AI chat with `summarize_conversation` tool
- **Environment**: `EXPO_PUBLIC_OPENAI_API_KEY`

### n8n Webhooks
- **Purpose**: RAG pipeline execution for conversation summarization
- **Endpoints**: Single webhook URL from environment variable
- **Input**: `{conversationId, userId}`
- **Output**: `[{summary: "..."}]`
- **Environment**: `EXPO_PUBLIC_N8N_WEBHOOK_URL`
- **Security**: Filters by user participation on Firebase side

### Firebase/Firestore
- **Collections**:
  - `conversations/{id}` - Conversation metadata
  - `conversations/{id}/messages/{msgId}` - Messages
  - `users/{userId}` - User profiles and presence
- **Real-time**: All data flows use `onSnapshot` listeners
- **Offline**: Firestore's native offline persistence

## Current Architecture Strengths

1. **Clear separation**: Services, hooks, and components are well-organized
2. **Real-time**: Firestore listeners provide instant updates
3. **Modular**: Each service has a focused responsibility
4. **Extensible**: Tool calling architecture allows easy addition of new tools
5. **Type-safe**: Strong TypeScript usage throughout
6. **Cross-platform**: Expo Go compatibility

## Known Areas for Improvement

1. **Large files**: `services/openai.ts` (364 lines) handles too much
2. **Indirection**: Multiple layers between UI and AI service calls
3. **Type safety**: Some API responses use `any` types
4. **Error handling**: Inconsistent patterns across services
5. **Code duplication**: Message formatting logic appears in multiple places


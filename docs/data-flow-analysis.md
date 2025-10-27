# Comm App - Complete Data Flow Analysis

## Overview
Comm is a React Native/Expo messaging app with Firebase backend, AI agent capabilities, and RAG integration via n8n. The app supports real-time messaging, presence tracking, typing indicators, and conversation summarization.

## Key Technologies
- **Frontend**: React Native 0.81, Expo SDK 54, Expo Router
- **Backend**: Firebase (Auth, Firestore)
- **AI**: OpenAI GPT-4o-mini
- **Workflow Automation**: n8n (webhooks for RAG pipeline)
- **Real-time**: Firestore listeners (`onSnapshot`)

---

## Core Data Flows

### 1. Authentication Flow

**Files**: `lib/firebase/auth.ts`, `app/(auth)/index.tsx`, `hooks/useAuthForm.ts`

```
User submits form → signUp/signIn → Firebase Auth
  ↓
ensureUserProfile() → Check if user exists in Firestore
  ↓
If new user:
  - Create user document in 'users' collection
  - Generate deterministic avatar color
  - Create AI conversation: [userId, 'ai-assistant']
  ↓
Redirect to tabs screen
```

**Data Structure**:
- `users/{userId}`: `{ name, avatarColor, lastSeen, currentlyTypingIn }`

---

### 2. Conversation List Flow

**Files**: `app/(tabs)/index.tsx`, `hooks/useConversations.ts`

```
Component mount → useConversations() hook
  ↓
Firestore query: conversations where participantIds array-contains userId
  ↓
Real-time listener (onSnapshot) → Updates on any conversation change
  ↓
For each conversation:
  - Fetch users collection for name lookup
  - Generate display name from participant names
  - Fetch last message from subcollection
  - Calculate timestamp
  ↓
Sort by lastMessageAt (in-memory)
  ↓
Filter out AI conversations (shown separately as sticky header)
  ↓
Render conversation list
```

**Data Structure**:
- `conversations/{conversationId}`: `{ participantIds: [], title?, createdAt, updatedAt }`
- `conversations/{conversationId}/messages/{messageId}`: `{ text, senderId, createdAt, deliveredTo: [], readBy: [] }`

---

### 3. New Conversation Flow

**Files**: `app/new-conversation.tsx`, `services/chat.ts`

```
User selects contacts → Creates participantIds array [senderId, ...contacts]
  ↓
createOrFindConversation(participantIds)
  ↓
Query Firestore for existing conversation with same participantIds (sorted!)
  ↓
If exists: Return existing conversationId
If not: Create new conversation document
  ↓
sendMessage(conversationId, text, senderId)
  ↓
Store message in Firestore subcollection
  ↓
Mark conversation updatedAt timestamp
  ↓
Navigate to chat screen
```

**Key Logic**: Sorting participantIds prevents duplicate conversations when order differs.

---

### 4. Message Display Flow

**Files**: `app/chat/[id].tsx`, `hooks/useMessages.ts`, `components/chat/Message.tsx`

```
Chat screen opens → useMessages(conversationId)
  ↓
Set up two real-time listeners:
  1. Messages listener: conversations/{id}/messages
  2. Users listener: users collection (for name/avatar lookup)
  ↓
onSnapshot callback triggered on any message change
  ↓
Process docChanges:
  - Mark new messages as delivered (if from other user)
  - Mark all messages as read (on chat open)
  ↓
Map messages with sender names, avatar colors, timestamps
  ↓
Calculate message status: sent/delivered/read (only on own messages)
  ↓
Update UI via FlatList
```

**Status Calculation** (`utils/messageStatus.ts`):
- `sent`: Only sender in deliveredTo array
- `delivered`: More than sender in deliveredTo array
- `read`: More than sender in readBy array

---

### 5. Message Sending Flow

**Files**: `services/chat.ts`, `app/chat/[id].tsx`

```
User types message → onSend handler
  ↓
Detect conversation type (AI vs regular)
  ↓
AI Conversation:
  sendAIMessage(conversationId, text, userId)
    ↓
    Store user message in Firestore
    ↓
    Fetch last 10 messages (user + AI only)
    ↓
    Call OpenAI chatWithAI() with conversation history
    ↓
    Store AI response as message with senderId 'ai-assistant'
  
Regular Conversation:
  sendMessage(conversationId, text, userId)
    ↓
    Store message in Firestore
    ↓
    Update conversation updatedAt timestamp
  ↓
Clear input, scroll to bottom
```

---

### 6. AI Chat Flow (with Tool Calling)

**Files**: `services/aiChat.ts`, `services/openai.ts`, `services/n8n.ts`

```
User sends message to AI → sendAIMessage()
  ↓
Store user message in Firestore
  ↓
Fetch conversation history (last 10 messages)
  ↓
Call OpenAI chatWithAI() with tools enabled
  ↓
OpenAI detects keywords (summary, action items, decisions)
  ↓
Returns tool_call calling appropriate function
  ↓
Tool execution:
  - summarize_conversation → n8n /summarize webhook
  - pull_actions → n8n /pull-actions webhook
  - get_decisions → n8n /get-decisions webhook
  ↓
Each webhook flow:
  1. Resolve conversationId (search by participant name if needed)
  2. Call n8n webhook with {conversationId, userId}
  3. n8n fetches messages from Firestore
  4. n8n sends to OpenAI for analysis
  5. Returns result as array: [{summary/actions/decisions: "..."}]
  ↓
Personalize response: Replace user IDs with names, current user with "You"
  ↓
Send tool results back to OpenAI
  ↓
OpenAI generates final response incorporating tool results
  ↓
Store AI response in Firestore
```

**Helper Functions** (`utils/conversationHelpers.ts`):
- `findConversationByParticipantName()`: Search conversations by participant name
- Prefers 1-on-1 conversations over group chats
- Filters by current user participation (security)

---

### 7. Presence System Flow

**Files**: `services/presence.ts`, `hooks/usePresence.ts`, `components/chat/ChatHeader.tsx`

```
Chat opens → updatePresence(userId)
  ↓
Set users/{userId}.lastSeen = serverTimestamp()
  ↓
usePresence hook listens to all participants' user documents
  ↓
Calculate online status: lastSeen within 30 seconds
  ↓
For group chats: Count online participants, show "X online · Y members"
  ↓
For 1-on-1: Show "online" or timestamp
  ↓
AppState listener updates presence on foreground
```

**Presence States**:
- Online: `lastSeen` within 30 seconds
- Offline: `lastSeen` older than 30 seconds or null

---

### 8. Typing Indicators Flow

**Files**: `services/presence.ts`, `app/chat/[id].tsx`

```
User types → handleInputChange()
  ↓
Set users/{userId}.currentlyTypingIn = conversationId
  ↓
usePresence hook detects typing status change
  ↓
Show "typing..." in chat header
  ↓
Clear typing after 3 seconds of inactivity
  ↓
Cleanup typing status on unmount
```

---

### 9. Message Status Update Flow

**Files**: `services/chat.ts`, `hooks/useMessages.ts`

```
On app open (tabs screen) → markConversationsDelivered(userId)
  ↓
Query all conversations where user is participant
  ↓
For each conversation: Query all messages
  ↓
Mark as delivered if senderId !== userId and not already in deliveredTo array
  ↓
On chat open → markRead(conversationId, userId)
  ↓
Query all messages in conversation
  ↓
Add userId to readBy array if not already present
```

---

### 10. Notifications Flow

**Files**: `hooks/useNotifications.ts`, `app/_layout.tsx`

```
App initialization → Configure expo-notifications
  ↓
useNotifications hook in tabs and chat screens
  ↓
Listen to all conversations except current one
  ↓
onSnapshot with docChanges() → Detect only new messages
  ↓
Check if message is from other user (not own message)
  ↓
Send foreground notification
  ↓
Track timestamp to avoid duplicate notifications
```

---

## File Structure & Responsibilities

### Core Services (`services/`)
- **`chat.ts`**: Message CRUD, conversation creation, status updates
- **`aiChat.ts`**: AI conversation orchestration, history fetching
- **`openai.ts`**: OpenAI API wrapper, tool calling, response personalization
- **`n8n.ts`**: n8n webhook integration for RAG tools
- **`presence.ts`**: User presence, typing status management
- **`aiPrompts.ts`**: AI system prompt configuration

### Hooks (`hooks/`)
- **`useAuth.ts`**: Current authenticated user
- **`useConversations.ts`**: Conversation list with real-time updates
- **`useMessages.ts`**: Messages for a conversation with status tracking
- **`useConversation.ts`**: Single conversation metadata
- **`useUsers.ts`**: All users for contact selection
- **`usePresence.ts`**: Presence indicators (online/typing)
- **`useNotifications.ts`**: Foreground notifications handling

### Firebase (`lib/firebase/`)
- **`app.ts`**: Firebase app initialization
- **`auth.ts`**: Authentication, user profile creation
- **`db.ts`**: Firestore instance

### Utilities (`utils/`)
- **`messageStatus.ts`**: Pure functions for calculating message status
- **`conversationHelpers.ts`**: Pure functions for conversation search/filtering

### UI Components (`components/`)
- **`chat/`**: ChatHeader, ChatInput, ChatMessages, Message
- **`conversation/`**: ConversationItem, ContactChip, EditableChipInput
- **`ui/`**: GlassCard, GradientBackground, GradientButton

---

## Key Architectural Patterns

1. **Firestore-first**: Single source of truth with native offline persistence
2. **Real-time listeners**: onSnapshot for live updates across app
3. **Arrays for tracking**: deliveredTo and readBy arrays in message documents
4. **Sort participants**: Prevents duplicate conversations
5. **Pure utility functions**: Extracted for testability and reusability
6. **Service layer separation**: API calls isolated from UI logic
7. **Tool calling pattern**: OpenAI → tools → n8n → personalize → response
8. **Sticky AI conversation**: Rendered outside FlatList for special positioning

---

## Data Models

### User Document
```typescript
users/{userId}: {
  name: string;
  avatarColor: string;
  lastSeen: Timestamp;
  currentlyTypingIn: string | null;
}
```

### Conversation Document
```typescript
conversations/{conversationId}: {
  participantIds: string[];  // Sorted!
  title?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Message Document
```typescript
conversations/{conversationId}/messages/{messageId}: {
  text: string;
  senderId: string;
  createdAt: Timestamp;
  deliveredTo: string[];  // Array of user IDs
  readBy: string[];       // Array of user IDs
}
```

---

## Security Considerations

1. **Query filtering**: All queries filter by current user's participation
2. **Participant validation**: Conversations only accessible by participants
3. **n8n webhooks**: Receive userId for additional filtering
4. **Silent failures**: Profile/status updates fail gracefully without breaking UI

---

## Known Limitations

1. In-memory sorting for conversations (no Firestore index)
2. Foreground-only notifications (no background/push)
3. No offline queue beyond Firestore cache
4. iPhone input area visibility issues (documented)
5. Conversation search by name requires fetching all users


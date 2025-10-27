# Comm App - Data Flow Summary

## Overview
Comm is a real-time chat application built with Expo SDK 54, React Native 0.81, and Firebase Firestore. The app supports cross-platform messaging (iOS, Android, Web) with AI-powered conversation features.

## Core Data Flow Architecture

### Authentication Flow
**Files**: `app/(auth)/index.tsx`, `hooks/useAuthForm.ts`, `lib/firebase/auth.ts`

```
User Input → useAuthForm Hook → Firebase Auth → User Document Created → Redirect to Tabs
```

1. User enters credentials in auth screen (`app/(auth)/index.tsx`)
2. `useAuthForm` hook manages form state and validation
3. Firebase Auth authenticates user
4. On signup, AI conversation is auto-created in Firestore
5. User document created with name, title, avatarColor
6. Redirect to tabs screen on success

### Conversation List Flow
**Files**: `app/(tabs)/index.tsx`, `hooks/useConversations.ts`, `services/chat.ts`

```
Firestore Real-time Listener → useConversations Hook → Format & Sort → UI Render
```

1. `useConversations` subscribes to Firestore `conversations` collection where user is participant
2. Real-time updates trigger listener on document changes
3. Hook fetches last message from each conversation's `messages` subcollection
4. Display names generated from participant IDs (maps to user names)
5. Conversations sorted by `lastMessageAt` timestamp in memory
6. AI conversations filtered out (shown separately as sticky header)
7. `app/(tabs)/index.tsx` renders conversation cards with GlassCard components

### Chat Screen Flow
**Files**: `app/chat/[id].tsx`, `hooks/useMessages.ts`, `services/chat.ts`, `services/aiChat.ts`

```
Messages Real-time Listener → useMessages Hook → Format Messages → UI Render
                ↓
User Input → sendMessage/sendAIMessage → Firestore Write → Optimistic Update
```

**Regular Chat Flow**:
1. `useMessages` subscribes to `conversations/{id}/messages` subcollection
2. Each message document contains: text, senderId, createdAt, deliveredTo[], readBy[]
3. Hook calculates message status from arrays (sent/delivered/read)
4. Messages formatted with sender names from `users` collection
5. User sends message → `sendMessage()` writes to Firestore → UI updates optimistically

**AI Chat Flow**:
1. Same message listener, but detected as AI conversation via `participantIds.includes('ai-assistant')`
2. User sends message → `sendAIMessage()` orchestration:
   - Step 1: Store user message in Firestore
   - Step 2: Fetch last 10 messages for context
   - Step 3: Call OpenAI API with conversation history and tool support
   - Step 4: Store AI response back to Firestore
3. AI responses have `senderId: 'ai-assistant'`

### AI Tool Calling Flow
**Files**: `services/openai.ts`, `services/n8n.ts`, `services/aiChat.ts`

```
User Message → OpenAI Detects Keywords → Tool Call → n8n Webhook → Firestore Query → Process → Personalize → OpenAI Final Response
```

1. User asks AI to summarize/pull actions/get decisions
2. `chatWithAI()` sends message to OpenAI with tools enabled
3. OpenAI detects keywords ("summary", "action items", "decisions") and calls appropriate tool
4. Tool handler (`resolveConversationId`) searches for conversation by ID or participant name
5. Calls n8n webhook (e.g., `/summarize`, `/pull-actions`, `/get-decisions`)
6. n8n workflow:
   - Fetches messages from Firestore
   - Processes with OpenAI
   - Returns summary/actions/decisions
7. `personalizeResponse()` replaces user IDs with names, current user with "You"
8. OpenAI generates final conversational response with tool results
9. Response stored in Firestore and displayed in chat

### Message Status Flow
**Files**: `hooks/useMessages.ts`, `services/chat.ts`, `utils/messageStatus.ts`

```
Sent (on send) → Delivered (on app open) → Read (on chat open)
```

1. **Sent**: Message written to Firestore with `deliveredTo: [senderId]`
2. **Delivered**: When user opens app (tabs screen), `markConversationsDelivered()` adds userId to all unread messages' `deliveredTo` array
3. **Read**: When user opens chat, `markRead()` adds userId to all messages' `readBy` array
4. Status calculated from array lengths: `read` if `readBy.length > 1`, `delivered` if `deliveredTo.length > 1`
5. Status only shown on current user's own messages

### Presence & Typing Flow
**Files**: `hooks/usePresence.ts`, `services/presence.ts`, `app/chat/[id].tsx`

```
Presence: User Activity → updatePresence() → users/{userId}.lastSeen → Real-time Listener → UI
Typing: Input Change → setTyping() → users/{userId}.currentlyTypingIn → Real-time Listener → "typing..." UI
```

1. **Presence**: User document has `lastSeen` timestamp, updated on chat open and app foreground
2. Online if `lastSeen` within 30 seconds of current time
3. Typing: User types → `setTyping(uid, conversationId)` sets `currentlyTypingIn` field
4. Auto-clears after 3 seconds of inactivity
5. Other users see "typing..." in chat header when `currentlyTypingIn === conversationId`

### New Conversation Flow
**Files**: `app/new-conversation.tsx`, `services/chat.ts`

```
Contact Selection → createOrFindConversation() → sendMessage() → Navigate to Chat
```

1. User selects contacts via EditableChipInput component
2. Types message in ChatInput
3. `createOrFindConversation()` checks if conversation exists (sorts participantIds)
4. If exists, returns existing conversationId; if not, creates new conversation document
5. Message sent with `sendMessage()`
6. Always navigates to chat screen after sending

## Key Technical Patterns

### Real-time Updates
- All data subscribed via Firestore `onSnapshot` listeners
- No polling, instant updates across all users
- Hooks manage subscription lifecycle

### Service Layer Pattern
- **services/chat.ts**: Core messaging operations
- **services/aiChat.ts**: AI conversation orchestration
- **services/openai.ts**: OpenAI API integration
- **services/n8n.ts**: n8n webhook integration
- **services/presence.ts**: Presence management

### Hook Pattern
- **hooks/useMessages.ts**: Manages message state with real-time listener
- **hooks/useConversations.ts**: Manages conversation list with real-time listener
- **hooks/usePresence.ts**: Manages presence state with real-time listener
- **hooks/useAuth.ts**: Manages authentication state
- All hooks return data directly to components

### Component Architecture
- **UI Primitives**: `GradientBackground`, `GlassCard`, `GradientButton` (glassmorphic design)
- **Chat Components**: `ChatInput`, `ChatMessages`, `ChatHeader`, `Message`
- **Conversation Components**: `ConversationItem`, `EditableChipInput`, `ContactChip`
- **Auth Components**: `FormInput`, `FormLabel`, `ErrorText`

### File Structure by Responsibility

**Screens** (`app/`):
- `(auth)/index.tsx` - Sign in/up screen
- `(tabs)/index.tsx` - Conversation list
- `chat/[id].tsx` - Chat screen
- `new-conversation.tsx` - New conversation creation

**Services** (`services/`):
- `chat.ts` - Core messaging operations
- `aiChat.ts` - AI conversation orchestration
- `openai.ts` - OpenAI API wrapper
- `n8n.ts` - n8n webhook client
- `presence.ts` - Presence management

**Hooks** (`hooks/`):
- `useMessages.ts` - Message state management
- `useConversations.ts` - Conversation list state
- `usePresence.ts` - Presence state
- `useAuth.ts` - Auth state
- `useUsers.ts` - User list state

**Components** (`components/`):
- `chat/` - Chat-specific components
- `conversation/` - Conversation-specific components
- `auth/` - Auth-specific components
- `ui/` - Reusable UI primitives

**Utils** (`utils/`):
- `messageStatus.ts` - Message status calculation
- `conversationHelpers.ts` - Conversation search logic

**Lib** (`lib/firebase/`):
- `app.ts` - Firebase app initialization
- `auth.ts` - Firebase auth configuration
- `db.ts` - Firestore database reference

## Data Models

### Conversation Document
```typescript
{
  participantIds: string[]; // Sorted array of user IDs
  title?: string; // Optional title (for AI conversations)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Message Document
```typescript
{
  text: string;
  senderId: string;
  createdAt: Timestamp;
  deliveredTo: string[]; // Array of user IDs who received it
  readBy: string[]; // Array of user IDs who read it
}
```

### User Document
```typescript
{
  name: string;
  email: string;
  avatarColor: string;
  lastSeen: Timestamp;
  currentlyTypingIn?: string; // Conversation ID where user is typing
}
```

## Key Flows Summary

1. **Authentication**: Firebase Auth → User Document → AI Conversation Creation
2. **Conversation List**: Firestore Listener → Format & Sort → GlassCard UI
3. **Messages**: Firestore Listener → Status Calculation → Message Bubbles
4. **AI Chat**: User Message → OpenAI API → Tool Detection → n8n Integration → Response
5. **Message Status**: Firestore Arrays → Status Calculation → Read Receipts
6. **Presence**: User Activity → Firestore Timestamp → Real-time Status
7. **Typing**: Input Events → Firestore Field → Typing Indicator


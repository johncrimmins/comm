# Firestore Data Flow Diagram

## Current Architecture (After Migration)

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Conversations   │  │ Chat Screen      │  │ New Conversation│ │
│  │ List Screen     │  │ [id].tsx         │  │ Screen          │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼─────────────────────┼──────────────────────┼──────────┘
            │                     │                      │
            │                     │                      │
┌───────────▼─────────────────────▼──────────────────────▼──────────┐
│                        HOOKS LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐                       │
│  │ useConversations│  │ useMessages      │                       │
│  │                 │  │                  │                       │
│  │ • Real-time     │  │ • Real-time      │                       │
│  │   listener      │  │   listener       │                       │
│  │ • Firestore     │  │ • Firestore      │                       │
│  │   query         │  │   query          │                       │
│  └────────┬────────┘  └────────┬─────────┘                       │
│           │                     │                                   │
│           │                     │                                   │
│  ┌────────▼─────────────────────▼─────────┐                       │
│  │        services/chat.ts               │                       │
│  │                                        │                       │
│  │ • createOrFindConversation()          │                       │
│  │ • sendMessage()                       │                       │
│  │ • markRead()                          │                       │
│  └────────┬───────────────────────────────┘                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │ Direct Firestore Operations
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                      FIRESTORE DATABASE                             │
│                                                                     │
│  conversations/{conversationId}                                     │
│    ├── participantIds: [userId1, userId2]                         │
│    ├── createdAt: Timestamp                                        │
│    ├── updatedAt: Timestamp                                        │
│    │                                                                │
│    ├── messages/{messageId}                                         │
│    │   ├── text: string                                            │
│    │   ├── senderId: string                                        │
│    │   ├── createdAt: Timestamp                                    │
│    │   └── status: 'sent' | 'delivered' | 'read'                   │
│    │                                                                │
│    └── state/state                                                  │
│        ├── typing: {userId: {isTyping, updatedAt}}                │
│        ├── delivery: {lastDeliveredAt: {userId: Timestamp}}         │
│        └── read: {lastReadAt: {userId: Timestamp}}                  │
│                                                                     │
│  users/{userId}                                                     │
│    ├── name: string                                                 │
│    ├── status: string                                               │
│    ├── avatarColor: string                                          │
│    ├── lastActiveAt: Timestamp                                      │
│    └── online: boolean                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### 1. User A Sends Message to User B

```
User A (Chat Screen)
    │
    │ 1. User types message "Hello"
    │    calls sendMessage(conversationId, "Hello", userIdA)
    ▼
services/chat.ts
    │
    │ 2. Direct write to Firestore
    │    setDoc(messages/{newId}, {text, senderId, createdAt})
    ▼
Firestore
    │
    │ 3. Firestore triggers real-time update
    ▼
User B (Chat Screen via useMessages hook)
    │
    │ 4. onSnapshot listener fires
    │    Message appears instantly in UI
    ▼
User B sees "Hello" in real-time
```

### 2. Creating New Conversation

```
User A (New Conversation Screen)
    │
    │ 1. Selects contacts, types message
    │    calls createOrFindConversation([userIdA, userIdB])
    ▼
services/chat.ts
    │
    │ 2. Creates conversation document
    │    setDoc(conversations/{newId}, {participantIds, createdAt})
    │
    │ 3. Creates first message
    │    setDoc(conversations/{id}/messages/{msgId}, {text, senderId})
    ▼
Firestore
    │
    │ 4. Real-time listeners update both users
    ▼
User A & User B
    │
    │ 5. useConversations hook receives update
    │    Conversation appears in both users' lists
    ▼
Both users see new conversation
```

### 3. Viewing Conversations List

```
User (Conversations List Screen)
    │
    │ 1. Component mounts
    │    useConversations() hook activates
    ▼
useConversations hook
    │
    │ 2. Sets up Firestore listener
    │    query(conversations).where(participantIds contains userId)
    │
    │ 3. For each conversation, fetches last message
    │    getDocs(conversations/{id}/messages, orderBy createdAt desc, limit 1)
    ▼
Firestore
    │
    │ 4. Returns conversations + last messages
    ▼
useConversations hook
    │
    │ 5. Formats data and updates state
    │    Returns ConversationPreviewUI[]
    ▼
UI shows conversations list
```

## Key Differences from SQLite Architecture

### Before (SQLite)
```
UI → SQLite (local cache) → Sync Engine → Firestore
                          ↓
                    Outbox Queue
```

### After (Direct Firestore)
```
UI → Hooks → Firestore (real-time listeners)
```

## Benefits

1. **Real-time Updates**: Firestore listeners push changes instantly
2. **Simpler Code**: No sync layer, no outbox management
3. **Offline Support**: Firestore SDK handles offline automatically
4. **Fewer Bugs**: Direct path reduces complexity
5. **Better Performance**: No SQLite queries, faster queries

## Current Limitations (MVP)

- ❌ No unread count calculation (simplified for MVP)
- ❌ No typing indicators (will add later)
- ❌ No presence status (will add later)
- ❌ Last message fetching could be optimized (nested queries)
- ❌ No message pagination (will add later)

## Future Enhancements

- Add caching layer for last messages
- Implement proper unread count from receipts
- Add typing indicators with real-time listeners
- Add presence status listeners
- Implement message pagination
- Add optimistic UI updates


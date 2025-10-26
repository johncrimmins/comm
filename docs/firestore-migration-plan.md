# Firestore Migration Plan: SQLite → Firestore Direct

## Overview
Replace SQLite-based local-first architecture with direct Firestore integration. No data migration needed - this is a complete rip-and-replace. Keep SQLite code for reference but route all new calls to Firestore.

## Current Architecture Analysis

### Data Flow
```
UI (Hooks) → DAOs (SQLite) → Sync Engine → Firestore
              ↓
           Local Cache
```

### Key Components Using SQLite
1. **DAOs** (`lib/sqlite/*`) - We'll bypass these entirely
2. **Hooks** - Update to use Firestore directly
   - `useConversations.ts` - Currently reads from SQLite
   - `useMessages.ts` - Currently reads from SQLite
   - `useUsers.ts` - Already uses Firestore directly ✓
3. **Services** - Update to use Firestore directly
   - `services/chat.ts` - Currently uses SQLite DAOs
4. **Sync Engine** - Remove/simplify significantly
   - `lib/sync.ts` - Only keep presence heartbeat
5. **UI Screens** - Minimal changes
   - `app/chat/[id].tsx` - Replace SQLite queries with Firestore
   - `app/new-conversation.tsx` - Replace SQLite writes with Firestore

## Migration Strategy

### Core Principle
**Simplify everything** - Skip DAO abstraction layer. Use Firestore directly in hooks and services. Keep the SQLite code for reference but route all calls to Firestore with the simplest possible implementation.

### Firestore Structure
```
Firestore Collections:
├── users/{uid}
│   ├── name: string
│   ├── status: string
│   ├── avatarColor: string
│   ├── lastActiveAt: Timestamp
│   └── online: boolean
│
├── conversations/{conversationId}
│   ├── participantIds: string[]
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   ├── messages/{messageId}
│   │   ├── text: string
│   │   ├── senderId: string
│   │   ├── createdAt: Timestamp
│   │   └── status: string
│   └── state/state
│       ├── typing: {userId: {isTyping: boolean, updatedAt: Timestamp}}
│       ├── delivery: {lastDeliveredAt: {userId: Timestamp}}
│       └── read: {lastReadAt: {userId: Timestamp}}
```

## Implementation Plan

### Minimal Scope: Hooks & Services Only

**What we're NOT doing:**
- ❌ Creating new DAO files
- ❌ Maintaining abstraction layers
- ❌ Complex type mappings
- ❌ Outbox/sync queue
- ❌ Any changes to UI rendering pages
- ❌ Sync engine at all (not even presence)

**What we ARE doing:**
- ✅ Update `useConversations` hook to query Firestore
- ✅ Update `useMessages` hook to query Firestore
- ✅ Update `services/chat.ts` to write to Firestore
- ✅ Keep all UI components untouched - zero changes to rendering logic
- ✅ Skip typing/presence for now - focus on basic chat only

### Phase 1: Update Hooks to Use Firestore Directly

#### 1.1 Update `hooks/useConversations.ts`
**Current:** Reads from SQLite on mount
**New:** Firestore real-time listener

```typescript
export function useConversations(): ConversationPreviewUI[] {
  const user = useAuthUser();
  const [items, setItems] = useState<ConversationPreviewUI[]>([]);
  
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }
    
    // Firestore real-time listener
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Calculate preview inline
        return buildConversationPreview(doc.id, data);
      });
      setItems(conversations);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  return items;
}
```

#### 1.2 Update `hooks/useMessages.ts`
**Current:** Reads from SQLite on mount
**New:** Firestore real-time listener

```typescript
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Firestore real-time listener
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        senderId: doc.data().senderId,
        createdAt: doc.data().createdAt.toMillis(),
        status: doc.data().status ?? null,
      }));
      setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [conversationId]);
  
  return messages;
}
```

### Phase 2: Update Services to Use Firestore Directly

#### 2.1 Update `services/chat.ts`
**Current:** SQLite insert + enqueue sync op
**New:** Direct Firestore write

```typescript
export async function createConversationLocal(participantIds: string[]): Promise<{ conversationId: string }> {
  const ref = doc(collection(db, 'conversations'));
  await setDoc(ref, {
    participantIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { conversationId: ref.id };
}

export async function sendMessageLocal(
  conversationId: string,
  text: string,
  senderId: string
): Promise<{ messageId: string; shouldNavigate: boolean }> {
  // Check if first message
  const existingRef = collection(db, 'conversations', conversationId, 'messages');
  const existingSnap = await getDocs(existingRef);
  const wasEmpty = existingSnap.empty;
  
  // Add message
  const msgRef = doc(existingRef);
  await setDoc(msgRef, {
    text,
    senderId,
    createdAt: serverTimestamp(),
    status: 'sent',
  });
  
  return { messageId: msgRef.id, shouldNavigate: wasEmpty };
}

export async function markRead(
  conversationId: string,
  userId: string,
  atMs: number = Date.now()
): Promise<void> {
  const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
  await updateDoc(stateRef, {
    [`read.lastReadAt.${userId}`]: Timestamp.fromMillis(atMs),
  });
}
```

### Phase 3: Remove Sync Engine References

#### 3.1 Update `app/_layout.tsx`
Remove or comment out `useSyncLifecycle()` call since sync engine won't exist.

#### 3.2 Comment out or remove `lib/sync.ts`
We won't use it at all - hooks handle everything.

## Migration Checklist

### No Data Migration Required
- [x] Fresh start - no SQLite data to migrate
- [x] SQLite code kept for reference only
- [x] All new data goes to Firestore

### Firestore Setup
- [ ] Enable Firestore in Firebase console
- [ ] Set up Firestore indexes for queries:
  - `conversations` collection: `participantIds` array-contains queries
  - `messages` subcollection: `createdAt` orderBy queries
- [ ] Configure Firestore rules (allow authenticated reads/writes)
- [ ] Enable offline persistence in Firebase SDK

### Testing Requirements
- [ ] Two users can send/receive messages in real-time
- [ ] Typing indicators work
- [ ] Presence status updates
- [ ] Message read receipts update correctly
- [ ] Conversations list refreshes in real-time
- [ ] Offline mode works (Firestore handles automatically)
- [ ] No memory leaks from listeners

### Performance Considerations
- [ ] Limit listener subscriptions to active conversations only
- [ ] Use pagination for messages in long conversations
- [ ] Debounce typing updates to Firestore
- [ ] Cache user presence data appropriately

## Benefits of Migration

1. **Much Simpler Architecture**: No DAO layer, no sync layer - just Firestore
2. **Real-time by Default**: Firestore listeners update UI automatically
3. **Built-in Offline**: Firestore SDK handles offline persistence
4. **Significantly Less Code**: Remove entire SQLite layer and sync engine
5. **Faster Development**: Direct Firestore calls are simpler to write and debug
6. **Easier Testing**: Mock Firestore listeners directly vs complex SQLite + sync system
7. **Greenfield Start**: No legacy data to worry about

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to UI | Medium | Test hooks return same shape |
| Loss of local-first behavior | Low | Firestore offline persistence covers this |
| Increased Firestore costs | Low | Free tier is generous; optimize queries |
| Performance regression | Low | Firestore is optimized; add pagination if needed |

## Rollback Plan

If issues arise:
1. Full rollback: `git revert` all changes - go back to SQLite implementation
2. SQLite code is preserved and ready to use again
3. No complex rollback needed since we're doing a clean replacement

## Timeline Estimate

- Phase 1 (Update Hooks): 1-2 hours
- Phase 2 (Update Services): 1 hour
- Phase 3 (Remove Sync Engine refs): 15 minutes
- Testing: 1-2 hours

**Total: 3-5 hours** (Bare minimum scope!)

## Next Steps

1. ✅ Review this plan (completed - bare minimum scope)
2. Update `useConversations` hook to query Firestore
3. Update `useMessages` hook to query Firestore
4. Update `services/chat.ts` to write to Firestore
5. Remove sync engine references from `app/_layout.tsx`
6. Test basic real-time chat functionality
7. Update memory bank documentation

## Summary

**Bare Minimum Scope - Basic Real-Time Chat Only:**
- ✅ Only 2 hooks to update (`useConversations`, `useMessages`)
- ✅ Only 1 service to update (`chat.ts`)
- ✅ Remove sync engine references
- ❌ No UI component changes at all
- ❌ No DAO layer
- ❌ No sync engine
- ❌ No typing/presence (skip for now)
- ❌ No data migration

**Files to Modify:**
1. `hooks/useConversations.ts` - Add Firestore listener
2. `hooks/useMessages.ts` - Add Firestore listener
3. `services/chat.ts` - Change writes to Firestore
4. `app/_layout.tsx` - Remove sync lifecycle

**Files NOT to Touch:**
- All UI components in `app/` and `components/`
- All SQLite code (kept for reference)
- Chat screen typing/presence logic (will work with static/placeholder data for now)


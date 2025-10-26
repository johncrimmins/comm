# Offline Persistence Implementation Plan

## Current State Analysis

### Firebase Implementation ✅
- **Firebase JS SDK v12.4.0** is correctly installed and being used
- Current hooks (`useMessages`, `useConversations`) connect directly to Firestore
- All operations write/read from Firestore in real-time

### SQLite Status
- **expo-sqlite v16.0.8** is installed ✅
- Current SQLite code in `lib/sqlite/` exists but is **NOT ACTIVE**
- `lib/sync.ts` references SQLite but sync.ts is never imported/used
- No current functionality depends on SQLite

### Key Insight
**Currently:** UI → Firestore (direct)  
**Target:** UI → SQLite → Firestore (with sync)

## Objectives

### Primary Goals
1. ✅ Preserve all existing Firestore functionality
2. ✅ Add SQLite as offline cache layer
3. ✅ Implement lightweight sync (one-time on login + incremental updates)
4. ✅ No UI changes - hooks handle data source abstraction

### What We're Building
- SQLite acts as **local cache** and **offline-first write layer**
- Firestore remains **source of truth** for conflicts
- Sync happens:
  - Once on login (bootstrap conversations + recent messages)
  - Continuously for new messages (listener writes to SQLite)
  - On send (write to SQLite + Firestore)
  - On read (update SQLite + Firestore)

## Implementation Plan

### Phase 1: Cleanup & Fresh Start

#### 1.1 Remove Old SQLite Code
**Files to Delete:**
- `lib/sqlite/connection.ts`
- `lib/sqlite/daoConversations.ts`
- `lib/sqlite/daoMessages.ts`
- `lib/sqlite/daoState.ts`
- `lib/sqlite/models.ts`
- `lib/sqlite/outbox.ts`
- `lib/sync.ts` (references old SQLite)
- `hooks/useSyncLifecycle.ts` (uses lib/sync)

**Files to Update:**
- `app/_layout.tsx` - Remove any sync references if present

#### 1.2 Verification
- No imports of SQLite DAOs anywhere
- No references to lib/sync.ts

---

### Phase 2: Create New Lightweight SQLite Layer

#### 2.1 Database Schema (`lib/db/schema.ts`)
```typescript
export const SCHEMA = `
  -- Conversations
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participantIds TEXT NOT NULL, -- JSON array
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  -- Messages
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    status TEXT, -- 'sent' | 'delivered' | 'read'
    FOREIGN KEY (conversationId) REFERENCES conversations(id)
  );

  -- Sync state
  CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversationId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updatedAt DESC);
`;
```

#### 2.2 Database Connection (`lib/db/index.ts`)
```typescript
import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('comm.db');
    await initializeSchema();
  }
  return db;
}

async function initializeSchema() {
  const db = await getDatabase();
  const statements = SCHEMA.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    await db.execAsync(stmt);
  }
}

// Helper for queries
export async function exec(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync(sql, params);
  return result;
}

// Helper for mutations
export async function run(sql: string, params: any[] = []): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(sql, params);
}
```

#### 2.3 Data Access Layer (`lib/db/access.ts`)
**Purpose:** Simple functions to read/write SQLite, mirroring our data model

```typescript
import { exec, run } from './index';

// Conversations
export async function saveConversation(id: string, participantIds: string[], createdAt: number, updatedAt: number) {
  await run(
    'INSERT OR REPLACE INTO conversations (id, participantIds, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [id, JSON.stringify(participantIds), createdAt, updatedAt]
  );
}

export async function getConversations(): Promise<any[]> {
  return await exec('SELECT * FROM conversations ORDER BY updatedAt DESC');
}

// Messages
export async function saveMessage(id: string, conversationId: string, senderId: string, text: string, createdAt: number, status?: string) {
  await run(
    'INSERT OR REPLACE INTO messages (id, conversationId, senderId, text, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, conversationId, senderId, text, createdAt, status || null]
  );
}

export async function getMessages(conversationId: string): Promise<any[]> {
  return await exec(
    'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
    [conversationId]
  );
}

// Sync state
export async function setSyncState(key: string, value: string) {
  await run('INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)', [key, value]);
}

export async function getSyncState(key: string): Promise<string | null> {
  const result = await exec('SELECT value FROM sync_state WHERE key = ?', [key]);
  return result[0]?.value || null;
}
```

---

### Phase 3: Sync Logic

#### 3.1 Initial Sync on Login (`lib/sync/initialSync.ts`)
```typescript
import { db } from '@/lib/firebase/db';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { saveConversation, saveMessage, setSyncState } from '@/lib/db/access';

export async function initialSync(userId: string) {
  console.log('🔄 [initialSync] Starting initial sync for user:', userId);
  
  // 1. Get user's conversations
  const conversationsSnapshot = await getDocs(
    query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId))
  );
  
  console.log(`📋 [initialSync] Found ${conversationsSnapshot.size} conversations`);
  
  // 2. For each conversation, save to SQLite and fetch recent messages
  for (const convDoc of conversationsSnapshot.docs) {
    const data = convDoc.data();
    const conversationId = convDoc.id;
    
    // Save conversation
    await saveConversation(
      conversationId,
      data.participantIds || [],
      data.createdAt?.toMillis() || Date.now(),
      data.updatedAt?.toMillis() || Date.now()
    );
    
    // Fetch last 50 messages
    const messagesSnapshot = await getDocs(
      query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
    );
    
    // Save messages (oldest first)
    const messages = messagesSnapshot.docs.reverse();
    for (const msgDoc of messages) {
      const msgData = msgDoc.data();
      await saveMessage(
        msgDoc.id,
        conversationId(,
        msgData.senderId,
        msgData.text,
        msgData.createdAt?.toMillis() || Date.now(),
        msgData.status
      );
    }
    
    console.log(`💾 [initialSync] Saved ${messages.length} messages for conversation ${conversationId}`);
  }
  
  // 3. Mark sync complete
  await setSyncState('lastSync', Date.now().toString());
  console.log('✅ [initialSync] Initial sync complete');
}
```

#### 3.2 Continuous Sync (`lib/sync/listeners.ts`)
**Purpose:** Firestore listeners that write to SQLite on changes

```typescript
import { db } from '@/lib/firebase/db';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { saveConversation, saveMessage } from '@/lib/db/access';

export function setupConversationsListener(userId: string) {
  const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId));
  
  return onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data();
        await saveConversation(
          change.doc.id,
          data.participantIds || [],
          data.createdAt?.toMillis() || Date.now(),
          data.updatedAt?.toMillis() || Date.now()
        );
      }
    }
  });
}

export function setupMessagesListener(conversationId: string) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data();
        await saveMessage(
          change.doc.id,
          conversationId,
          data.senderId,
          data.text,
          data.createdAt?.toMillis() || Date.now(),
          data.status
        );
      }
    }
  });
}
```

---

### Phase 4: Update Hooks to Read from SQLite

#### 4.1 Update `hooks/useConversations.ts`
**Change:** Read from SQLite instead of Firestore directly

```typescript
import { useEffect, useState } from 'react';
import { getConversations } from '@/lib/db/access';
import { useAuthUser } from '@/hooks/useAuth';

export function useConversations(): ConversationPreviewUI[] {
  const user = useAuthUser();
  const [items, setItems] = useState<ConversationPreviewUI[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }
    
    // Read from SQLite
    const loadConversations = async () => {
      const conversations = await getConversations();
      // Transform to UI format
      setItems(conversations.map(conv => ({...})));
    };
    
    loadConversations();
    
    // Poll or use listener for updates
    const interval = setInterval(loadConversations, 2000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  return items;
}
```

#### 4.2 Update `hooks/useMessages.ts`
**Change:** Read from SQLite + set up Firestore listener to update SQLite

```typescript
import { useEffect, useState } from 'react';
import { getMessages } from '@/lib/db/access';
import { setupMessagesListener } from '@/lib/sync/listeners';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Load from SQLite
    const loadMessages = async () => {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    };
    
    loadMessages();
    
    // Set up Firestore listener to update SQLite
    const unsubscribe = setupMessagesListener(conversationId);
    
    return () => unsubscribe();
  }, [conversationId]);

  return messages;
}
```

---

### Phase 5: Update Services to Write to Both

#### 5.1 Update `services/chat.ts` - sendMessage
```typescript
export async function sendMessage(conversationId: string, text: string, senderId: string) {
  // 1. Generate local message ID
  const messageId = generateId('msg');
  const createdAt = Date.now();
  
  // 2. Write to SQLite immediately (optimistic UI)
  await saveMessage(messageId, conversationId, senderId, text, createdAt, 'sent');
  
  // 3. Write to Firestore
  const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
  await setDoc(messageRef, {
    text,
    senderId,
    createdAt: serverTimestamp(),
    status: 'sent',
  });
  
  // Firestore listener will update SQLite with server timestamp
  return { messageId, shouldNavigate: wasEmpty };
}
```

#### 5.2 Update `services/chat.ts` - markRead
```typescript
export async function markRead(conversationId: string, userId: string) {
  // Write to Firestore (already doing this)
  const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
  await setDoc(stateRef, {
    [`read.lastReadAt.${userId}`]: Timestamp.now(),
  }, { merge: true });
  
  // Update SQLite sync state (optional, for offline tracking)
  await setSyncState(`read_${conversationId}`, Date.now().toString());
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              SEND MESSAGE          OPEN CHAT
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐   ┌──────────────┐
        │ Write to SQLite   │   │ Read from    │
        │ (optimistic)      │   │ SQLite       │
        └─────────┬─────────┘   └──────┬───────┘
                  │                   │
                  ▼                   │
        ┌───────────────────┐         │
        │ Write to Firestore│         │
        └─────────┬─────────┘         │
                  │                   │
                  ▼                   │
        ┌───────────────────┐         │
        │ Firestore Listener │◄────────┘
        │ Updates SQLite     │
        └───────────────────┘
```

### Login Flow
```
1. User logs in
2. Call initialSync(userId)
   - Fetch conversations from Firestore
   - Fetch last 50 messages per conversation
   - Save all to SQLite
3. UI loads from SQLite (fast, no loading spinner)
4. Background listeners update SQLite as new data arrives
```

### Send Message Flow
```
1. User sends message
2. Write to SQLite immediately (status='sent')
3. UI updates instantly (optimistic)
4. Write to Firestore
5. Firestore listener detects write
6. Updates SQLite with server timestamp
7. Recipient's listener updates their SQLite
8. Recipient's UI updates automatically
```

---

## Implementation Checklist

### Step 1: Cleanup ✅
- [ ] Delete old SQLite files
- [ ] Remove lib/sync.ts references
- [ ] Verify no broken imports

### Step 2: Fresh SQLite Layer ✅
- [ ] Create lib/db/schema.ts
- [ ] Create lib/db/index.ts
- [ ] Create lib/db/access.ts
- [ ] Test database initialization

### Step 3: Sync Logic ✅
- [ ] Create lib/sync/initialSync.ts
- [ ] Create lib/sync/listeners.ts
- [ ] Test initial sync on login

### Step 4: Update Hooks ✅
- [ ] Update useConversations to read SQLite
- [ ] Update useMessages to read SQLite
- [ ] Test offline behavior

### Step 5: Update Services ✅
- [ ] Update sendMessage to write SQLite + Firestore
- [ ] Update markRead to write both
- [ ] Test sync behavior

### Step 6: Integration ✅
- [ ] Wire up initialSync on login
- [ ] Set up continuous listeners
- [ ] Test end-to-end

---

## Testing Strategy

### Test Cases
1. **Offline Send**
   - Send message offline
   - Verify appears in SQLite
   - Go online
   - Verify syncs to Firestore

2. **Offline Read**
   - Start app offline
   - Verify conversations load from SQLite
   - Verify messages load from SQLite

3. **Initial Sync**
   - Login with existing conversations
   - Verify all conversations + messages appear quickly

4. **Real-time Updates**
   - Have two devices
   - Send message on device A
   - Verify appears on device B (from SQLite cache)

---

## Risk Mitigation

### No Functionality Loss Guarantee
- ✅ Hooks maintain same API (return same data shape)
- ✅ Services maintain same signature
- ✅ UI components unchanged
- ✅ Firestore remains source of truth
- ✅ Gradual migration: SQLite added as cache layer

### Rollback Plan
- Keep Firestore direct path in place
- Can switch hooks back to Firestore if needed
- SQLite is add-only layer, doesn't replace Firestore

---

## Timeline Estimate
- Phase 1 (Cleanup): 15 min
- Phase 2 (SQLite Layer): 30 min
- Phase 3 (Sync Logic): 45 min
- Phase 4 (Hook Updates): 30 min
- Phase 5 (Service Updates): 20 min
- Phase 6 (Integration & Testing): 30 min

**Total: ~3 hours**

---

## Next Steps
1. Review this plan for approval
2. Confirm approach aligns with requirements
3. Proceed with implementation


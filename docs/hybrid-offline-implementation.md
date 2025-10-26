# Hybrid Offline Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                           │
│  (useMessages, useConversations hooks)               │
└────────────┬──────────────────┬──────────────────────┘
             │                  │
             ▼                  ▼
    ┌─────────────────┐  ┌─────────────────┐
    │ Firestore       │  │ SQLite          │
    │ Listeners       │  │ Cache           │
    │ (Primary)       │  │ (Offline)       │
    └────────┬────────┘  └────────┬────────┘
             │                    │
             │ Update UI          │ Read when offline
             │ Write to SQLite   │ Queue failed writes
             │                   │
             ▼                   ▼
    ┌─────────────────────────────────┐
    │     Firestore (Source)           │
    └─────────────────────────────────┘
```

## Core Principles

1. **Firestore drives UI** - Listeners update React state directly
2. **SQLite as cache** - Write-through on Firestore updates
3. **Offline reads** - Fallback to SQLite when offline
4. **Single write path** - Firestore → SQLite (no dual writes)

## Implementation Steps

### Step 1: Cleanup Old SQLite Code ✅
- Delete `lib/sqlite/` directory entirely
- Delete `lib/sync.ts` (uses old SQLite)
- Delete `hooks/useSyncLifecycle.ts`
- Verify no broken imports

### Step 2: Create New SQLite Layer
**Files to create:**
- `lib/db/schema.ts` - Database schema
- `lib/db/index.ts` - Database connection & initialization
- `lib/db/access.ts` - Simple read/write functions

**Schema:**
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  participantIds TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  status TEXT
);

CREATE TABLE pending_messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  retryCount INTEGER DEFAULT 0
);

CREATE INDEX idx_messages_convo ON messages(conversationId, createdAt);
CREATE INDEX idx_conversations_updated ON conversations(updatedAt DESC);
```

### Step 3: Create Sync Service
**File:** `lib/sync/index.ts`

**Functions:**
- `initializeDatabase()` - Set up SQLite schema
- `loadFromSQLite()` - Read cache when offline
- `writeToSQLite()` - Write-through on Firestore updates
- `flushPending()` - Retry failed sends when back online

### Step 4: Update Hooks
**Hook pattern:**
```typescript
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Firestore listener (primary)
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // 1. Update UI from Firestore
      const msgs = snapshot.docs.map(...);
      setMessages(msgs);
      
      // 2. Write to SQLite cache
      await writeToSQLite('messages', msgs);
    });
    
    return () => unsubscribe();
  }, [conversationId]);
  
  // Fallback to SQLite when offline
  useEffect(() => {
    if (isOffline) {
      loadFromSQLite(conversationId).then(setMessages);
    }
  }, [isOffline, conversationId]);
  
  return messages;
}
```

### Step 5: Update Services
**Send message pattern:**
```typescript
export async function sendMessage(conversationId, text, senderId) {
  try {
    // Write to Firestore
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    await setDoc(messageRef, {
      text,
      senderId,
      createdAt: serverTimestamp(),
      status: 'sent',
    });
    
    // Firestore listener will update SQLite
    return { messageId: messageRef.id };
  } catch (error) {
    // Offline: Save to pending_messages
    if (isOfflineError(error)) {
      await savePendingMessage(conversationId, text, senderId);
      return { messageId: generateId('pending') };
    }
    throw error;
  }
}
```

### Step 6: Network State Tracking
**File:** `lib/network/index.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';

let isOnline = true;

NetInfo.addEventListener(state => {
  isOnline = state.isConnected ?? false;
  if (isOnline) {
    flushPendingMessages();
  }
});

export function getNetworkState() {
  return isOnline;
}
```

### Step 7: Integration
- Initialize database on app start
- Set up network listener
- Update hooks to use hybrid approach
- Test offline/online scenarios

## Key Implementation Details

### Database Initialization
```typescript
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('comm.db');
    await initializeSchema();
  }
  return db;
}
```

### Write-Through Cache
```typescript
async function writeToSQLite(type: 'messages' | 'conversations', data: any[]) {
  const database = await getDatabase();
  
  await database.withTransactionAsync(async () => {
    for (const item of data) {
      if (type === 'messages') {
        await database.runAsync(
          'INSERT OR REPLACE INTO messages VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.conversationId, item.senderId, item.text, item.createdAt, item.status]
        );
      }
    }
  });
}
```

### Offline Detection
```typescript
function isOfflineError(error: any): boolean {
  return error?.code === 'unavailable' || 
         error?.message?.includes('network') ||
         !navigator.onLine;
}
```

## Testing Checklist

- [ ] Online: Firestore listener updates UI
- [ ] Online: SQLite cache is populated
- [ ] Offline: SQLite cache is read
- [ ] Offline: Send message queues to pending
- [ ] Online (reconnect): Pending messages flush
- [ ] App restart: SQLite data persists
- [ ] No duplicate messages
- [ ] Status updates work correctly

## Risk Mitigation

1. **No UI reading from SQLite** - Firestore listeners only
2. **Single write path** - Firestore → SQLite
3. **Proper error handling** - Catch offline errors
4. **Transaction safety** - Use SQLite transactions
5. **Clear separation** - Firestore = UI, SQLite = cache

## File Structure

```
lib/
├── db/
│   ├── schema.ts          # SQL schema
│   ├── index.ts           # Database connection
│   └── access.ts          # Read/write functions
├── sync/
│   └── index.ts           # Sync logic
├── network/
│   └── index.ts           # Network state
└── firebase/              # Existing (unchanged)
```

## Migration Path

1. Add SQLite as cache layer (no breaking changes)
2. Keep existing Firestore functionality
3. Gradually add offline features
4. Test thoroughly before deploying


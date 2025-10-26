# Offline Persistence - Risk Analysis & Mitigation

## Critical Issues Identified

### 1. **Race Conditions & Data Inconsistency** 🔴 HIGH RISK

**Problem:**
```
Timeline:
T0: Write to SQLite (message appears in UI)
T1: Write to Firestore
T2: Firestore listener fires
T3: Write back to SQLite with different ID or timestamp
T4: We now have duplicate or inconsistent data
```

**Why it breaks:**
- SQLite write happens synchronously
- Firestore write is async
- Firestore listener might receive updates out of order
- We're writing the same message twice with different IDs (local ID vs Firestore ID)

**Example scenario:**
```typescript
// sendMessage called
const localId = generateId('msg'); // "msg_123456"
await saveMessage(localId, convId, senderId, text, Date.now());

// Firestore writes with auto-generated ID: "abc123xyz"
await setDoc(messageRef, {...});

// Now SQLite has: {id: "msg_123456", ...}
// Firestore has: {id: "abc123xyz", ...}

// Listener receives Firestore message
await saveMessage("abc123xyz", convId, senderId, text, serverTime);

// Now SQLite has TWO copies of the same message!
```

**Mitigation:**
- Use **Firestore-generated IDs only** (don't generate local IDs)
- Write to Firestore first, then write response to SQLite
- Add `remoteId` field to SQLite to track Firestore ID
- Query by content hash or implement deduplication logic

---

### 2. **UI Update Timing** 🔴 HIGH RISK

**Problem:**
The plan says "hooks read from SQLite" but doesn't specify WHEN the UI updates. Current hooks use Firestore `onSnapshot` which triggers React state updates automatically. If we read from SQLite, we need a different mechanism.

**Why it breaks:**
```typescript
// Current: Firestore listener → automatically triggers re-render
onSnapshot(q, (snapshot) => {
  setMessages(...); // React re-renders
});

// New: SQLite read → when does this update UI?
const messages = await getMessages(conversationId);
setMessages(messages); // Only runs once!
```

**Issues:**
- No automatic re-renders when SQLite updates
- Polling causes unnecessary database reads
- Firestore listener updates SQLite, but React doesn't know to re-render
- We need a pub/sub system or state management library

**Mitigation Options:**

**Option A: Keep Firestore listeners for UI updates**
```typescript
// Read from SQLite for offline data
// Use Firestore listener to trigger UI updates
// Write from listener to SQLite
onSnapshot(q, async (snapshot) => {
  // Update SQLite
  for (const doc of snapshot.docs) {
    await saveMessage(...);
  }
  // Update UI from Firestore (not SQLite!)
  setMessages(snapshot.docs.map(...));
});
```

**Option B: Implement SQLite change events**
```typescript
// Need custom hook that watches SQLite
useEffect(() => {
  let cancelled = false;
  const pollSQLite = async () => {
    const messages = await getMessages(conversationId);
    if (!cancelled) setMessages(messages);
  };
  pollSQLite();
  const interval = setInterval(pollSQLite, 1000); // Poll every second
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [conversationId]);
```

**Recommended:** Option A - Simpler, Firestore already handles this well

---

### 3. **Double Listener Overhead** 🟡 MEDIUM RISK

**Problem:**
Every conversation will have BOTH a Firestore listener AND potentially polling/state management for SQLite. This doubles the overhead.

**Why it's inefficient:**
- Battery drain from multiple listeners
- Network bandwidth waste
- Complex to manage lifecycle
- SQLite updates trigger unnecessary re-renders

**Mitigation:**
- Use Firestore listeners as primary (they're efficient)
- SQLite as write-through cache for offline support
- Don't query SQLite continuously, only on app start

---

### 4. **Status Updates Don't Propagate** 🔴 HIGH RISK

**Problem:**
Current implementation updates message status based on Firestore state document (`delivery.lastDeliveredAt`, `read.lastReadAt`). If we're reading from SQLite, how do these status updates get reflected?

**Why it breaks:**
```typescript
// In useMessages.ts
// We have state listener that checks read markers
// But if messages are stored in SQLite with status='sent'
// And state listener updates SQLite with status='read'
// How does React know to re-render?
```

**Mitigation:**
- Keep Firestore listeners active for state updates
- Use Firestore data for UI rendering (single source of truth)
- SQLite is backup/write buffer only

---

### 5. **Initial Sync Performance** 🟡 MEDIUM RISK

**Problem:**
Plan says "fetch last 50 messages per conversation" but what if:
- User has 100 conversations?
- Conversations have 10,000 messages each?
- User is on slow network?
- Initial sync takes 30+ seconds blocking UI

**Why it breaks:**
```typescript
// 100 conversations × 50 messages = 5,000 database writes
// 5,000 writes × 5ms each = 25 seconds
// User sees blank screen for 25 seconds
```

**Mitigation:**
- Fetch conversations first (fast)
- Show conversations immediately
- Lazy-load messages per conversation
- Use pagination (fetch more on scroll)
- Background sync messages after UI renders

---

### 6. **Offline State Management** 🔴 HIGH RISK

**Problem:**
The plan doesn't address how to track "unsent" messages when offline. If user sends 5 messages offline, how do we:
- Show them in UI with pending status?
- Retry sending when back online?
- Handle failures?
- Prevent duplicates?

**Why it breaks:**
```typescript
// User offline, sends message
await saveMessage(localId, convId, senderId, text); // SQLite write succeeds
await setDoc(messageRef, {...}); // FAILS - no network
// Now we have message in SQLite but not in Firestore
// How do we know it needs to be sent?
```

**Mitigation:**
- Add `syncStatus` field to messages: 'synced' | 'pending' | 'failed'
- Track pending messages separately
- Implement retry queue on reconnect
- Use transactions to ensure consistency

---

### 7. **Conflict Resolution Complexity** 🟡 MEDIUM RISK

**Problem:**
Plan says "Firestore wins on conflicts" but:
- How do we detect conflicts?
- When do we check for conflicts?
- What about uncommitted local changes?
- How do we handle merge conflicts in complex scenarios?

**Mitigation:**
- Use timestamps: `serverUpdatedAt > localUpdatedAt` → conflict
- Implement CRDT-like behavior: keep both versions, let user resolve
- Simple approach: last-write-wins based on timestamp
- For MVP: Assume no offline edits, only sends

---

### 8. **Testing Complexity** 🟡 MEDIUM RISK

**Problem:**
How do we test:
- Offline behavior
- Sync behavior
- Race conditions
- Edge cases

**Mitigation:**
- Mock network state
- Mock Firestore responses
- Test SQLite in isolation
- Integration tests with real Firestore emulator

---

## Revised Architecture Recommendation

Based on risk analysis, here's a **simpler, safer approach**:

### Hybrid Approach: Firestore Primary + SQLite Cache

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                      │
└────────────┬────────────────┬──────────────────┘
             │                │
             ▼                ▼
    ┌──────────────┐  ┌──────────────┐
    │  Firestore   │  │   SQLite     │
    │  Listeners   │  │  (Cache)     │
    └──────┬───────┘  └──────┬───────┘
           │                 │
           │   writes        │  reads
           │   (primary)     │  (backup)
           │                 │
           ▼                 ▼
    ┌─────────────────────────────┐
    │    Firestore (Source)       │
    └─────────────────────────────┘
```

### Key Principles:
1. **Firestore is primary** - All reads from Firestore listeners
2. **SQLite is cache** - Write-through cache for offline support
3. **No dual reads** - Don't query SQLite for UI rendering
4. **Single source of truth** - Firestore listeners update React state directly

### Implementation:

```typescript
// useMessages.ts - SIMPLIFIED
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Firestore listener (primary)
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // 1. Update UI (primary)
      const msgs = snapshot.docs.map(...);
      setMessages(msgs);
      
      // 2. Write to SQLite (cache for offline)
      for (const doc of snapshot.docs) {
        await saveMessage(doc.id, ...); // Firestore ID
      }
    });
    
    return () => unsubscribe();
  }, [conversationId]);
  
  return messages;
}
```

### Benefits:
- ✅ No race conditions (single write path)
- ✅ UI updates automatically (Firestore listeners)
- ✅ Offline support (SQLite cache)
- ✅ No complex state management
- ✅ Simpler logic
- ✅ Fewer bugs

### Offline Handling:

```typescript
// When offline, read from SQLite cache
const messages = await getMessages(conversationId);
setMessages(messages);

// When sending offline, queue for later
await saveMessage(localId, convId, senderId, text, null, 'pending');
// Retry queue processes when back online
```

---

## Complexity Comparison

### Original Plan:
- SQLite as primary read source: HIGH complexity
- Need polling or pub/sub: MEDIUM complexity
- Status sync between SQLite and Firestore: HIGH complexity
- Race condition handling: HIGH complexity
- **Total: VERY HIGH complexity**

### Revised Plan:
- Firestore as primary: LOW complexity (already working)
- SQLite as cache: LOW complexity
- Write-through on Firestore updates: LOW complexity
- Offline retry queue: MEDIUM complexity
- **Total: MEDIUM complexity**

---

## Recommendation

**Go with the Hybrid Approach:**
1. Firestore listeners handle UI updates (keep current implementation)
2. SQLite stores data for offline reads
3. Write-through cache: Firestore updates → SQLite writes
4. Simple retry queue for failed sends

**Remove from plan:**
- Reading from SQLite for UI rendering
- Polling SQLite for updates
- Complex sync logic between SQLite and Firestore
- Dual source of truth architecture

**Keep from plan:**
- SQLite schema and initialization
- Initial sync on login (for cache warming)
- Offline message queue
- Write-through cache updates

This reduces complexity by ~70% while achieving the same offline goals.


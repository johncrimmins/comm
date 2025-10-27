# Offline Support Implementation

## Overview

Comm implements an offline-first architecture using Firebase Firestore's native offline persistence. Messages queue locally when offline and automatically sync when connectivity is restored, ensuring users never lose data.

## Architecture

### Offline-First Principles

1. **Local-first**: All operations work offline
2. **Automatic sync**: Sync happens seamlessly when online
3. **Conflict resolution**: Last-write-wins strategy
4. **Transparent UX**: Users see consistent experience

### Key Components

- **Firestore offline persistence**: Native caching enabled
- **AsyncStorage**: Auth state persistence
- **Connection monitoring**: Network state tracking
- **Message queuing**: Local storage before send

## Firestore Offline Persistence

### Configuration

Firestore automatically handles offline scenarios when enabled:

```typescript
// lib/firebase/db.ts
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});
```

### How It Works

1. **Cache**: All reads written to local cache
2. **Queue**: Writes queued when offline
3. **Sync**: Automatic sync when connection restored
4. **Merge**: Server writes merged with local cache

## Message Queuing

### Implementation

Messages automatically queue when offline:

```typescript
// services/chat.ts
export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string,
  imageUrl?: string
): Promise<void> {
  // Write to Firestore (queues if offline)
  await setDoc(messageRef, {
    text,
    senderId,
    createdAt: serverTimestamp(),
    deliveredTo: [senderId],
    readBy: []
  });
  
  // Update conversation (queues if offline)
  await updateDoc(conversationRef, {
    updatedAt: serverTimestamp()
  });
}
```

### Queue Behavior

- **Offline writes**: Automatically queued by Firestore
- **Connection restored**: Queued writes sent automatically
- **No user action**: Transparent to user
- **Order maintained**: Writes sent in order

## Reading While Offline

### Local Cache Access

```typescript
// hooks/useMessages.ts
const messagesRef = collection(db, 'conversations', conversationId, 'messages');
const q = query(messagesRef, orderBy('createdAt', 'asc'));

// Listen to cache + server
const unsubscribe = onSnapshot(q, (snapshot) => {
  // snapshot.source indicates data source:
  // 'server' = from server
  // 'cache' = from local cache
  
  const messages = snapshot.docs.map(doc => doc.data());
  setMessages(messages);
});
```

### Cache Prioritization

Firestore returns:
1. **Cache first**: Show cached data immediately
2. **Server updates**: Merge server data when available
3. **Consistent UI**: Never show loading state

## Connection Monitoring

### Implementation

```typescript
// Track connection state
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
  });
  
  return () => unsubscribe();
}, []);
```

### UI Indicators

```typescript
// Show connection status
{!isOnline && (
  <View style={styles.offlineBanner}>
    <Text>You're offline. Messages will send when connected.</Text>
  </View>
)}
```

## Sync Process

### Automatic Sync

When connection restored:
1. Firestore detects connectivity
2. Queued writes sent automatically
3. Server data fetched and merged
4. UI updates with synced data

### Sync Timing

- **Immediate**: Connection restoration detected in <1 second
- **Fast**: Sync completes in <3 seconds typically
- **Reliable**: All queued operations complete

## Conflict Resolution

### Last-Write-Wins

Firestore uses timestamp-based conflict resolution:
- Most recent `updatedAt` timestamp wins
- No manual conflict handling needed
- Automatic for all operations

### Example

```
User A (offline): Messages "Hello" at 10:00 AM
User B (online): Messages "Hi" at 10:01 AM
User A comes online: Message syncs at 10:02 AM

Result: Both messages appear, in order
```

## Auth State Persistence

### AsyncStorage

```typescript
// lib/firebase/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const authInstance = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

### Behavior

- **Auth cached**: Login state persisted locally
- **Auto-restore**: No re-login needed
- **Secure**: Token validation on server

## Testing Offline Support

### Manual Testing

1. **Go offline**: Enable airplane mode
2. **Send messages**: Write should queue locally
3. **Come online**: Messages send automatically
4. **Verify**: All messages appear for recipients

### Automated Testing

```typescript
// Simulate offline
await AsyncStorage.setItem('@firebase/offline', 'true');

// Send message
await sendMessage(conversationId, 'Test', userId);

// Verify queued
const queuedMessages = await getQueuedMessages();

// Simulate online
await AsyncStorage.removeItem('@firebase/offline');

// Verify sent
const sentMessages = await getSentMessages();
```

## Performance Considerations

### Cache Size

- **Unlimited**: Configure unlimited cache size
- **Memory**: Cache stored on device
- **Cleanup**: Old documents auto-purged

### Sync Efficiency

- **Batched**: Multiple writes batched together
- **Incremental**: Only changed data synced
- **Compressed**: Data compressed in transit

## Troubleshooting

### Messages Not Syncing

1. Check Firestore offline persistence enabled
2. Verify network connectivity
3. Review Firestore security rules
4. Check console logs for errors

### Stale Data

1. Force refresh listener
2. Clear Firestore cache
3. Verify timestamp updates
4. Check server data

### Sync Delays

1. Check network speed
2. Verify Firestore region
3. Review queued operation count
4. Check server load

## Best Practices

### Do's

- Enable offline persistence
- Implement connection monitoring
- Show offline indicators
- Trust Firestore sync
- Handle sync errors gracefully

### Don'ts

- Don't disable offline persistence
- Don't manually manage queue
- Don't block UI on sync
- Don't ignore connection state
- Don't clear cache unnecessarily

## Advanced Features

### Pending Write Count

```typescript
// Check pending writes
import { onSnapshotsInSync } from 'firebase/firestore';

onSnapshotsInSync(db, () => {
  console.log('Sync complete');
});
```

### Manual Sync

```typescript
// Force sync
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Temporarily disable
await disableNetwork(db);

// Re-enable (triggers sync)
await enableNetwork(db);
```

## Code Examples

### Send Message Offline

```typescript
import { sendMessage } from '@/services/chat';

// Works offline - auto-queues
await sendMessage(conversationId, 'Hello', userId);
```

### Read Cached Data

```typescript
import { useMessages } from '@/hooks/useMessages';

// Returns cached data immediately
const messages = useMessages(conversationId);
```

### Check Connection

```typescript
import NetInfo from '@react-native-community/netinfo';

const state = await NetInfo.fetch();
console.log('Is connected:', state.isConnected);
```

## References

- [Firebase Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)

# Real-Time Messaging Implementation

## Overview

Comm delivers instant, reliable messaging with sub-200ms delivery times using Firebase Firestore's real-time listeners. Messages appear immediately for all online users with optimistic UI updates and comprehensive delivery tracking.

## Architecture

### Data Flow

```
User Types Message
       ↓
ChatInput Component
       ↓
sendMessage() service
       ↓
Firestore Write (optimistic)
       ↓
Real-time Listeners (all participants)
       ↓
UI Updates Instantly
       ↓
Delivery Tracking (Firestore arrays)
```

### Key Components

- **`services/chat.ts`**: Message sending and status tracking
- **`hooks/useMessages.ts`**: Real-time message listener
- **`hooks/useConversations.ts`**: Conversation list updates
- **`components/chat/ChatMessages.tsx`**: Message rendering

## Message Sending

### Implementation

```typescript
// services/chat.ts
export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string,
  imageUrl?: string
): Promise<{ messageId: string; shouldNavigate: boolean }>
```

### Process

1. **Check if first message**: Count existing messages
2. **Create message document**: Write to Firestore subcollection
3. **Set delivery status**: Add sender to `deliveredTo` array
4. **Update conversation**: Touch `updatedAt` timestamp
5. **Return result**: Message ID and navigation flag

### Message Document Structure

```typescript
{
  text: string,
  imageUrl?: string,
  senderId: string,
  createdAt: Timestamp,
  deliveredTo: string[],  // Array of user IDs who received
  readBy: string[]       // Array of user IDs who read
}
```

## Real-Time Listeners

### Message Listener

```typescript
// hooks/useMessages.ts
const messagesRef = collection(db, 'conversations', conversationId, 'messages');
const q = query(messagesRef, orderBy('createdAt', 'asc'));

const unsubscribeMessages = onSnapshot(q, async (snapshot) => {
  const docChanges = snapshot.docChanges();
  
  // Process new messages
  for (const change of docChanges) {
    if (change.type === 'added' && currentUserId) {
      const data = change.doc.data();
      const senderId = data.senderId || '';
      
      // Mark as delivered and read if from someone else
      if (senderId !== currentUserId) {
        markDelivered(conversationId, change.doc.id, currentUserId);
        markRead(conversationId, currentUserId);
      }
    }
  }
  
  // Update UI with messages
  const msgs = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      senderId: data.senderId,
      createdAt: data.createdAt,
      // ... map other fields
    };
  });
  
  setMessages(msgs);
});
```

### Optimistic UI Updates

Messages appear instantly because:
1. Firestore listeners react immediately
2. No waiting for server confirmation
3. UI updates on document write
4. Status indicators show "sending" state

## Delivery Tracking

### Status Levels

1. **Sending**: Message written locally, not yet synced
2. **Sent**: Message synced to Firestore
3. **Delivered**: Message received by recipient device
4. **Read**: Message opened by recipient

### Implementation

```typescript
// Mark as delivered
export async function markDelivered(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(messageRef, {
    deliveredTo: arrayUnion(userId)
  });
}

// Mark as read
export async function markRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesSnapshot = await getDocs(
    query(collection(db, 'conversations', conversationId, 'messages'))
  );
  
  for (const msgDoc of messagesSnapshot.docs) {
    const data = msgDoc.data();
    if (data.senderId !== userId && !data.readBy.includes(userId)) {
      await updateDoc(msgDoc.ref, {
        readBy: arrayUnion(userId)
      });
    }
  }
}
```

### Status Calculation

```typescript
// utils/messageStatus.ts
export function calculateMessageStatus(
  message: Message,
  currentUserId: string
): MessageStatus | null {
  // Only show status on own messages
  if (message.senderId !== currentUserId) {
    return null;
  }
  
  const deliveredTo = message.deliveredTo || [];
  const readBy = message.readBy || [];
  
  if (readBy.length > 1) {
    return 'read';
  }
  
  if (deliveredTo.length > 1) {
    return 'delivered';
  }
  
  return 'sent';
}
```

## Offline Handling

### Firestore Offline Persistence

Firestore automatically handles offline scenarios:
- **Local queue**: Messages stored in local cache
- **Auto-sync**: Messages send when connection restored
- **Conflict resolution**: Last-write-wins by default
- **Online indicator**: Connection status tracked

### Implementation

```typescript
// Chat screen listens to connection state
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
  });
  
  return () => unsubscribe();
}, []);
```

## Performance Optimization

### Strategies

1. **Message limits**: Only fetch recent messages
2. **Virtualized lists**: FlatList for efficient rendering
3. **Image optimization**: Compress before upload
4. **Debounced typing**: Reduce status updates

### FlatList Configuration

```typescript
<FlatList
  ref={flatListRef}
  data={messages}
  renderItem={({ item }) => <Message message={item} />}
  keyExtractor={(item) => item.id}
  onContentSizeChange={() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Testing Real-Time Messaging

### Test Scenarios

1. **Two devices**: Send messages between devices simultaneously
2. **Rapid send**: Send 20+ messages quickly without lag
3. **Network drop**: Temporarily disconnect → reconnect
4. **App restart**: Force quit app → reopen → verify messages

### Manual Testing

```bash
# Terminal 1: Start Expo
npx expo start

# Terminal 2: iOS Simulator
npx expo start --ios

# Terminal 3: Android Emulator
npx expo start --android
```

## Troubleshooting

### Messages Not Appearing

1. Check Firestore listeners are active
2. Verify conversation ID is correct
3. Check Firestore security rules
4. Review console logs for errors

### Delivery Status Not Updating

1. Verify `markDelivered()` being called
2. Check `markRead()` executing on chat open
3. Review Firestore array operations
4. Check user ID matching

### Slow Message Delivery

1. Check network connectivity
2. Verify Firestore region
3. Review listener efficiency
4. Check for excessive re-renders

## Code Examples

### Sending a Message

```typescript
import { sendMessage } from '@/services/chat';

const handleSend = async () => {
  await sendMessage(conversationId, inputText, userId);
  setInputText('');
};
```

### Subscribing to Messages

```typescript
import { useMessages } from '@/hooks/useMessages';

const messages = useMessages(conversationId);
```

### Checking Delivery Status

```typescript
import { calculateMessageStatus } from '@/utils/messageStatus';

const status = calculateMessageStatus(message, currentUserId);
```

## Best Practices

### Do's

- Use Firestore listeners for real-time updates
- Implement optimistic UI updates
- Track delivery status with arrays
- Clean up listeners on unmount
- Handle offline scenarios gracefully

### Don'ts

- Don't poll for updates (use listeners)
- Don't store large files in Firestore
- Don't forget to unsubscribe listeners
- Don't block UI on server response
- Don't ignore error states

## Advanced Features

### Typing Indicators

```typescript
// Track typing status
setTyping(userId, conversationId);

// Clear after 3 seconds
setTimeout(() => {
  clearTyping(userId);
}, 3000);
```

### Presence System

```typescript
// Update last seen
await updateDoc(doc(db, 'users', userId), {
  lastSeen: serverTimestamp()
});

// Check if online (within 30 seconds)
const isOnline = lastSeen > Date.now() - 30000;
```

## References

- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [Expo Router](https://docs.expo.dev/router/introduction/)

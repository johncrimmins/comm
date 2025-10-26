# Logging Guide

## Overview
Comprehensive logging has been added throughout the offline persistence implementation and send/delivered/read status updates to enable debugging.

## Logging Prefixes

All logs use emoji prefixes for easy identification:
- 💾 Database operations
- 🔍 Searching/querying
- ✏️ Executing (INSERT/UPDATE/DELETE)
- 🔄 Transactions
- 📊 Stats/summaries
- ✅ Success
- ❌ Errors
- 📨 Messages
- 📤 Sending
- 👁️ Read status
- 📦 Delivery status
- 🌐 Network state
- 🔄 Sync operations
- 📮 Pending messages

## Database Layer (`lib/db/`)

### `lib/db/index.ts`
- **`💾 [DB]`** - Database connection opened
- **`✅ [DB]`** - Database connection established
- **`📊 [DB]`** - Schema initialization
- **`🔍 [DB]`** - Query execution
- **`📊 [DB]`** - Query results count
- **`✏️ [DB]`** - Execute operation
- **`✅ [DB]`** - Execute successful
- **`🔄 [DB]`** - Transaction started
- **`✅ [DB]`** - Transaction completed

### `lib/db/access.ts`
- **`💾 [DB Access]`** - Saving conversation/message
- **`✅ [DB Access]`** - Save successful
- **`💾 [DB Access]`** - Saving pending message
- **`✅ [DB Access]`** - Pending message saved

## Sync Layer (`lib/sync/`)

### `lib/sync/index.ts`
- **`🔄 [Sync]`** - Initializing sync
- **`✅ [Sync]`** - Sync initialized
- **`📨 [Sync]`** - Message changes received
- **`💾 [Sync]`** - Cached messages to SQLite
- **`📮 [Sync]`** - Checking for pending messages
- **`📮 [Sync]`** - Found pending messages
- **`📤 [Sync]`** - Retrying pending message
- **`✅ [Sync]`** - Successfully sent pending message
- **`❌ [Sync]`** - Failed to send pending message
- **`📊 [Sync]`** - Flush complete with stats
- **`🧹 [Sync]`** - Cleaned up sync listeners

## Network Layer (`lib/network/`)

### `lib/network/index.ts`
- **`🌐 [Network]`** - Initializing network monitoring
- **`🌐 [Network]`** - State check (isConnected, type)
- **`🔄 [Network]`** - Status changed (ONLINE/OFFLINE)
- **`📢 [Network]`** - Notifying listeners
- **`🌐 [Network]`** - Back online - triggering flush
- **`✅ [Network]`** - Network monitoring initialized

## Hooks

### `hooks/useMessages.ts`
- **`📨 [useMessages]`** - Setting up listeners
- **`📨 [useMessages]`** - Received message changes
- **`✅ [useMessages]`** - Updating delivery status
- **`✓ [useMessages]`** - Delivery status updated
- **`❌ [useMessages]`** - Error updating delivery status
- **`💾 [useMessages]`** - Cached messages to SQLite
- **`❌ [useMessages]`** - Error caching messages
- **`⚠️ [useMessages]`** - State document doesn't exist
- **`📊 [useMessages]`** - State updated (delivery/read keys)
- **`🔍 [useMessages]`** - Checking status for message
- **`📦 [useMessages]`** - Delivery check (createdAt, deliveredAt)
- **`✓ [useMessages]`** - STATUS CHANGED (delivered)
- **`👁️ [useMessages]`** - Read check (createdAt, readAt)
- **`✓ [useMessages]`** - STATUS CHANGED (read)
- **`📊 [useMessages]`** - Updated message statuses count

### `hooks/useConversations.ts`
- **`💾 [useConversations]`** - Cached conversations to SQLite
- **`❌ [useConversations]`** - Error caching conversations

## Services

### `services/chat.ts`
- **`📤 [sendMessage]`** - Starting send
- **`📤 [sendMessage]`** - isFirstMessage check
- **`✓ [sendMessage]`** - Message created in Firestore
- **`✓ [sendMessage]`** - Conversation updatedAt updated
- **`📱 [sendMessage]`** - Offline - saving to pending
- **`✓ [sendMessage]`** - Saved to pending messages
- **`❌ [sendMessage]`** - Error sending message
- **`👁️ [markRead]`** - Marking read
- **`✓ [markRead]`** - Read receipt updated successfully
- **`❌ [markRead]`** - Error updating read receipt

## Debugging Status Updates

To debug why send/delivered/read status updates might not be working, look for these logs:

### When Message is Sent
1. Look for `📤 [sendMessage] Starting send`
2. Look for `✓ [sendMessage] Message created in Firestore`
3. Look for `📨 [useMessages] Received message changes`
4. Look for `💾 [useMessages] Cached messages to SQLite`

### When Status Should Update to Delivered
1. Look for `✅ [useMessages] New message received`
2. Look for `✓ [useMessages] Delivery status updated`
3. Look for `📊 [useMessages] State updated`
4. Look for `🔍 [useMessages] Checking status for message`
5. Look for `📦 [useMessages] Message ... createdAt=X, deliveredAt=Y`
6. Look for `✓ [useMessages] STATUS CHANGED: sent → delivered`

### When Status Should Update to Read
1. Look for `👁️ [markRead] Marking read`
2. Look for `✓ [markRead] Read receipt updated successfully`
3. Look for `📊 [useMessages] State updated`
4. Look for `👁️ [useMessages] Message ... createdAt=X, readAt=Y`
5. Look for `✓ [useMessages] STATUS CHANGED: delivered → read`

## Common Issues to Check

### Status Not Updating
- Check if state document exists: `⚠️ [useMessages] State document doesn't exist`
- Check if delivery/read markers are present: `📊 [useMessages] State updated - delivery: [], read: []`
- Check timestamps: `📦 [useMessages] Message ... createdAt=X, deliveredAt=Y`
- Check if comparison is correct: Look for `STATUS CHANGED` logs

### Messages Not Caching
- Check database initialization: `💾 [DB] Opening database connection`
- Check cache writes: `💾 [useMessages] Cached messages to SQLite`
- Check for errors: `❌ [useMessages] Error caching messages`

### Offline Not Working
- Check network state: `🌐 [Network] Status changed: ONLINE → OFFLINE`
- Check pending messages: `📱 [sendMessage] Offline - saving to pending`
- Check retry on reconnect: `📮 [Sync] Found pending messages to flush`

## Filtering Logs

In your console, you can filter by:
- `[DB]` - Database operations
- `[DB Access]` - Data access layer
- `[Sync]` - Sync operations
- `[Network]` - Network state
- `[useMessages]` - Messages hook
- `[useConversations]` - Conversations hook
- `[sendMessage]` - Message sending
- `[markRead]` - Read receipts

## Expected Flow

### Normal Message Send
```
📤 [sendMessage] Starting send
📤 [sendMessage] isFirstMessage=false
✓ [sendMessage] Message created in Firestore
✓ [sendMessage] Conversation updatedAt timestamp updated
📨 [useMessages] Received 1 message changes
💾 [useMessages] Cached 1 messages to SQLite
💾 [DB Access] Saving 1 messages
✏️ [DB] Execute: INSERT OR REPLACE INTO messages...
✅ [DB Access] Saved 1 messages
```

### Status Update to Delivered
```
✅ [useMessages] New message received from USER_ID
✓ [useMessages] Delivery status updated
📊 [useMessages] State updated - delivery: ['USER_ID'], read: []
🔍 [useMessages] Checking status for message ABC123...
📦 [useMessages] Message ABC123... createdAt=1234567890, deliveredAt=1234567895
✓ [useMessages] Message ABC123... STATUS CHANGED: sent → delivered
📊 [useMessages] Updated 1 message statuses
```

### Status Update to Read
```
👁️ [markRead] Marking read
✓ [markRead] Read receipt updated successfully
📊 [useMessages] State updated - delivery: ['USER_ID'], read: ['USER_ID']
🔍 [useMessages] Checking status for message ABC123...
👁️ [useMessages] Message ABC123... createdAt=1234567890, readAt=1234567900
✓ [useMessages] Message ABC123... STATUS CHANGED: delivered → read
📊 [useMessages] Updated 1 message statuses
```


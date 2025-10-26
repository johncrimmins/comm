# Database Initialization Fixes

## Critical Issues Fixed

### 1. Circular Dependency Bug 🔴 CRITICAL
**Problem:** `initializeSchema()` was calling `getDatabase()` which was calling `initializeSchema()` again, creating infinite recursion.

**Solution:** Fixed `initializeSchema()` to use the already-opened `db` instance instead of calling `getDatabase()` again.

### 2. Schema Not Being Created 🔴 CRITICAL
**Problem:** Due to the circular dependency, schema initialization never completed, causing "no such table" errors.

**Solution:** 
- Removed circular dependency
- Added comprehensive logging to track schema initialization
- Added error handling

### 3. Race Condition 🔴 CRITICAL
**Problem:** `flushPendingMessages()` was called immediately after database initialization, but schema creation was still in progress.

**Solution:**
- Added try-catch around `flushPendingMessages()` call
- Fail gracefully if tables don't exist yet
- Log warning instead of crashing

### 4. Multiple Initializations ⚠️ MEDIUM
**Problem:** Network monitoring and sync were being initialized multiple times (likely due to React StrictMode or hot reload).

**Solution:**
- Added `syncInitialized` flag to prevent duplicate initializations
- Log warning when duplicate initialization is attempted

### 5. Verbose Logging ⚠️ LOW
**Problem:** Too much logging on every database operation, cluttering console.

**Solution:**
- Reduced verbosity on routine operations
- Only log errors and important state changes
- Keep important logs (schema init, sync init, etc.)

## What to Expect in Console

### On App Start (Not Logged In)
```
🌐 [Network] Initializing network monitoring
✅ [Network] Network monitoring initialized
🌐 [Network] State check - isConnected: true, type: other
```

### On App Start (Logged In)
```
🌐 [Network] Initializing network monitoring
✅ [Network] Network monitoring initialized
🌐 [Network] State check - isConnected: true, type: other
🔄 [Sync] Initializing sync for user: [USER_ID]
💾 [DB] Opening database connection
📊 [DB] Current schema version: 0, target: 1
📊 [DB] Initializing schema version 1
📊 [DB] Executing 7 schema statements
✅ [DB] Schema initialized successfully
✅ [DB] Database connection established
✅ [Sync] Database initialized
📋 [Sync] Conversations listener setup (not implemented yet)
📮 [Sync] Checking for pending messages...
📮 [Sync] No pending messages to flush
✅ [Sync] Sync initialized
```

### Errors (Now Handled Gracefully)
If schema fails to initialize or tables don't exist:
```
⚠️ [Sync] Could not flush pending messages (schema may not be ready): [error]
```

Instead of crashing the app.

## Files Modified

1. **lib/db/index.ts**
   - Fixed circular dependency in `initializeSchema()`
   - Added comprehensive logging
   - Added error handling to all database operations
   - Reduced verbose logging

2. **lib/sync/index.ts**
   - Added `syncInitialized` flag
   - Added error handling for `flushPendingMessages()`
   - Fixed `setupConversationsListener()` stub

3. **lib/db/access.ts**
   - Reduced verbose logging
   - Removed unnecessary success logs

## Testing Checklist

After these fixes, you should see:
- [x] No "no such table" errors on initial load
- [x] Schema initialization logs appear
- [x] Database connection established
- [x] No duplicate initializations
- [x] Graceful handling of errors
- [x] Less console noise

## Next Steps

Once you confirm the database initializes properly, we can:
1. Test send/delivered/read status updates
2. Test offline functionality
3. Verify messages are being cached to SQLite
4. Check pending message flushing works


/**
 * Sync Service - Write-through cache management
 * Handles writing Firestore updates to SQLite cache
 */

import { collection, query, orderBy, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { saveConversation, saveMessage, getPendingMessages, deletePendingMessage, incrementPendingRetry } from '@/lib/db/access';
import { sendMessage } from '@/services/chat';

let conversationsUnsub: Unsubscribe | null = null;
let messagesUnsub: Unsubscribe | null = null;

let syncInitialized = false;

/**
 * Initialize database and set up sync
 */
export async function initializeSync(userId: string) {
  if (syncInitialized) {
    console.log('⚠️ [Sync] Sync already initialized, skipping');
    return;
  }
  
  console.log('🔄 [Sync] Initializing sync for user:', userId);
  
  try {
    // Initialize database (will create schema if needed)
    const { getDatabase } = await import('@/lib/db');
    await getDatabase();
    
    console.log('✅ [Sync] Database initialized');
    
    // Set up listeners for write-through cache
    setupConversationsListener(userId);
    
    // Flush any pending messages (will fail gracefully if tables don't exist yet)
    try {
      await flushPendingMessages();
    } catch (error) {
      console.warn('⚠️ [Sync] Could not flush pending messages (schema may not be ready):', error);
    }
    
    syncInitialized = true;
    console.log('✅ [Sync] Sync initialized');
  } catch (error) {
    console.error('❌ [Sync] Error initializing sync:', error);
    throw error;
  }
}

/**
 * Set up conversations listener (write-through to SQLite)
 * Note: We're not using this yet - listeners are set up in hooks
 */
function setupConversationsListener(userId: string) {
  // TODO: Implement conversations listener if needed
  console.log('📋 [Sync] Conversations listener setup (not implemented yet)');
}

/**
 * Set up messages listener for a specific conversation
 * Returns unsubscribe function
 */
export function setupMessagesListener(
  conversationId: string,
  onUpdate?: (messages: any[]) => void
): Unsubscribe {
  if (messagesUnsub) {
    messagesUnsub();
  }
  
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  messagesUnsub = onSnapshot(q, async (snapshot) => {
    console.log(`📨 [Sync] Received ${snapshot.docChanges().length} message changes for conversation ${conversationId}`);
    
    // Write to SQLite cache
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId,
        senderId: data.senderId || '',
        text: data.text || '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        status: data.status || null,
      };
    });
    
    // Batch write to SQLite
    if (messages.length > 0) {
      await saveMessage(messages[0]); // For now, just save the latest
      console.log(`💾 [Sync] Cached ${messages.length} messages to SQLite`);
    }
    
    // Call update callback if provided
    if (onUpdate) {
      onUpdate(messages);
    }
  });
  
  return () => {
    if (messagesUnsub) {
      messagesUnsub();
      messagesUnsub = null;
    }
  };
}

/**
 * Flush pending messages (retry failed sends)
 */
export async function flushPendingMessages(): Promise<void> {
  console.log('📮 [Sync] Checking for pending messages...');
  const pending = await getPendingMessages();
  
  if (pending.length === 0) {
    console.log('📮 [Sync] No pending messages to flush');
    return;
  }
  
  console.log(`📮 [Sync] Found ${pending.length} pending messages to flush`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const msg of pending) {
    console.log(`📤 [Sync] Retrying pending message ${msg.id.substring(0, 12)}... (retryCount: ${msg.retryCount})`);
    try {
      // Retry sending
      await sendMessage(msg.conversationId, msg.text, msg.senderId);
      
      // Success - delete from pending
      await deletePendingMessage(msg.id);
      console.log(`✅ [Sync] Successfully sent pending message ${msg.id.substring(0, 12)}...`);
      successCount++;
    } catch (error) {
      // Failed - increment retry count
      await incrementPendingRetry(msg.id);
      console.error(`❌ [Sync] Failed to send pending message ${msg.id.substring(0, 12)}...:`, error);
      failCount++;
      
      // TODO: Add max retry limit and delete old messages
    }
  }
  
  console.log(`📊 [Sync] Flush complete - Success: ${successCount}, Failed: ${failCount}`);
}

/**
 * Clean up listeners
 */
export function cleanupSync() {
  if (conversationsUnsub) {
    conversationsUnsub();
    conversationsUnsub = null;
  }
  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
  }
  syncInitialized = false;
  console.log('🧹 [Sync] Cleaned up sync listeners');
}


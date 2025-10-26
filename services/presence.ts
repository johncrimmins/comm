import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

/**
 * Update user's presence timestamp
 * Call this when user is active (app foreground, chat open, etc.)
 */
export async function updatePresence(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    // Silent failure for presence updates
  }
}

/**
 * Set user as typing in a conversation
 */
export async function setTyping(userId: string, conversationId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      currentlyTypingIn: conversationId,
    }, { merge: true });
  } catch (error) {
    // Silent failure for typing updates
  }
}

/**
 * Clear user's typing status
 */
export async function clearTyping(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      currentlyTypingIn: null,
    }, { merge: true });
  } catch (error) {
    // Silent failure for typing updates
  }
}

/**
 * Check if a user is online based on their lastSeen timestamp
 * Online = lastSeen within last 30 seconds
 */
export function isOnline(lastSeen: Timestamp | null | undefined): boolean {
  if (!lastSeen) return false;
  
  const thirtySecondsAgo = Date.now() - 30 * 1000;
  const lastSeenMs = lastSeen.toMillis();
  
  return lastSeenMs > thirtySecondsAgo;
}


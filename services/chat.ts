import { collection, doc, setDoc, updateDoc, getDocs, query, orderBy, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

export async function createOrFindConversation(participantIds: string[]): Promise<{ conversationId: string }> {
  // IMPORTANT: Sort participantIds to ensure consistency
  // This prevents creating duplicate conversations when order differs
  const sortedParticipants = [...participantIds].sort();
  
  // Check if conversation already exists
  const existingQuery = query(
    collection(db, 'conversations'),
    where('participantIds', '==', sortedParticipants)
  );
  
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    return { conversationId: existingSnapshot.docs[0].id };
  }
  
  // Create new conversation document in Firestore
  const conversationRef = doc(collection(db, 'conversations'));
  await setDoc(conversationRef, {
    participantIds: sortedParticipants,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return { conversationId: conversationRef.id };
}

export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string
): Promise<{ messageId: string; shouldNavigate: boolean }> {
  try {
    // Check if this is the first message
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
    const wasEmpty = messagesSnapshot.empty;

    // Create message document in Firestore
    const messageRef = doc(messagesRef);
    await setDoc(messageRef, {
      text,
      senderId,
      createdAt: serverTimestamp(),
      status: 'sent',
    });

    // Update conversation's updatedAt timestamp
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      updatedAt: serverTimestamp(),
    });

    return { messageId: messageRef.id, shouldNavigate: wasEmpty };
  } catch (error: any) {
    throw error;
  }
}

export async function markRead(
  conversationId: string,
  userId: string,
  atMs: number = Date.now()
): Promise<void> {
  // Update read receipt in Firestore state document (use setDoc with merge to handle creation)
  const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
  try {
    await setDoc(stateRef, {
      [`read.lastReadAt.${userId}`]: Timestamp.fromMillis(atMs),
    }, { merge: true });
  } catch (error) {
    throw error;
  }
}

export async function getUnreadCountFor(
  conversationId: string,
  currentUserId: string
): Promise<number> {
  // For MVP, simplified - just count messages not from current user
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
  const unreadCount = messagesSnapshot.docs.filter((doc) => doc.data().senderId !== currentUserId).length;
  
  return unreadCount;
}


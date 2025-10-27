import { collection, doc, setDoc, updateDoc, getDocs, query, orderBy, serverTimestamp, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

export async function createOrFindConversation(participantIds: string[], title?: string): Promise<{ conversationId: string }> {
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
    title: title || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return { conversationId: conversationRef.id };
}

/**
 * Update conversation title in Firestore
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      title: title.trim() || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw error;
  }
}

export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string,
  imageUrl?: string
): Promise<{ messageId: string; shouldNavigate: boolean }> {
  try {
    // Check if this is the first message
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
    const wasEmpty = messagesSnapshot.empty;

    // Create message document in Firestore
    const messageRef = doc(messagesRef);
    const messageData: any = {
      text,
      senderId,
      createdAt: serverTimestamp(),
      deliveredTo: [senderId], // Sender has "received" their own message immediately
      readBy: [],
    };
    
    // Add imageUrl if provided
    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }
    
    await setDoc(messageRef, messageData);

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

/**
 * Mark a message as delivered by adding userId to deliveredTo array
 */
export async function markDelivered(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) return;
    
    // Get current arrays
    const messageData = messageSnap.data();
    const deliveredTo = messageData?.deliveredTo || [];
    
    // Add userId if not already present
    if (!deliveredTo.includes(userId)) {
      await updateDoc(messageRef, {
        deliveredTo: [...deliveredTo, userId],
      });
    }
  } catch (error) {
    // Silent failure for delivery updates
  }
}

/**
 * Mark all unread messages in a conversation as read by adding userId to readBy array
 */
export async function markRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
    
    // Update all messages that user hasn't read yet
    const updatePromises = messagesSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const readBy = data.readBy || [];
      
      // Only update if this user hasn't read it yet
      if (!readBy.includes(userId)) {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnap.id);
        await updateDoc(messageRef, {
          readBy: [...readBy, userId],
        });
      }
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    throw error;
  }
}

/**
 * Mark all conversations as delivered when user opens app
 * Called from tabs screen on mount
 */
export async function markConversationsDelivered(userId: string): Promise<void> {
  try {
    // Get all conversations where user is a participant
    const conversationsRef = collection(db, 'conversations');
    const conversationsSnapshot = await getDocs(
      query(conversationsRef, where('participantIds', 'array-contains', userId))
    );
    
    // Process each conversation
    for (const convDoc of conversationsSnapshot.docs) {
      const conversationId = convDoc.id;
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
      
      // Mark delivered for all messages user hasn't received yet
      for (const msgDoc of messagesSnapshot.docs) {
        const data = msgDoc.data();
        const senderId = data.senderId;
        const deliveredTo = data.deliveredTo || [];
        
        // If it's not the user's own message and they haven't been marked as delivered
        if (senderId !== userId && !deliveredTo.includes(userId)) {
          await markDelivered(conversationId, msgDoc.id, userId);
        }
      }
    }
  } catch (error) {
    // Silent failure for delivery updates
  }
}


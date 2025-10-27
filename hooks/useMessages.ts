import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';
import { markDelivered, markRead } from '@/services/chat';
import { calculateMessageStatus } from '@/utils/messageStatus';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState(
    [] as Array<{
      id: string;
      text: string;
      senderId: string;
      senderName?: string;
      senderAvatarColor?: string;
      createdAt: number;
      status: 'sent' | 'delivered' | 'read' | null;
      deliveredTo?: string[];
      readBy?: string[];
    }>
  );
  
  const [users, setUsers] = useState<Record<string, { name: string; avatarColor: string }>>({});
  
  const currentUser = useAuthUser();
  const currentUserId = currentUser?.uid;

  // Fetch all users for name lookup
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersMap: Record<string, { name: string; avatarColor: string }> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        usersMap[doc.id] = { 
          name: data.name || 'user',
          avatarColor: data.avatarColor || '#7C3AED'
        };
      });
      // Add AI assistant as a special user
      usersMap['ai-assistant'] = {
        name: 'Comms (AI)',
        avatarColor: '#C084FC'
      };
      setUsers(usersMap);
    });
    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    // Query Firestore messages subcollection for this conversation
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // Set up real-time listener for messages
    const unsubscribeMessages = onSnapshot(q, async (snapshot) => {
      const docChanges = snapshot.docChanges();
      
      // Process incoming messages and mark them as delivered and read
      for (const change of docChanges) {
        if (change.type === 'added' && currentUserId) {
          const data = change.doc.data();
          const senderId = data.senderId || '';
          
          // If this is someone else's message TO us, mark it as delivered and read
          if (senderId !== currentUserId) {
            // Mark as delivered (fire and forget)
            markDelivered(conversationId, change.doc.id, currentUserId).catch(() => {});
            // Mark as read since user is actively viewing the chat (fire and forget)
            markRead(conversationId, currentUserId).catch(() => {});
          }
        }
      }
      
      // Also process existing messages that haven't been marked as delivered yet
      if (currentUserId) {
        const existingMsgs = snapshot.docs;
        for (const msgDoc of existingMsgs) {
          const data = msgDoc.data();
          const senderId = data.senderId || '';
          const deliveredTo = data.deliveredTo || [];
          
          // If it's not our own message and we haven't marked it as delivered
          if (senderId !== currentUserId && !deliveredTo.includes(currentUserId)) {
            markDelivered(conversationId, msgDoc.id, currentUserId).catch(() => {});
          }
        }
      }
      
      // Map all messages to state with sender names and status
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const senderId = data.senderId || '';
        const sender = users[senderId];
        const deliveredTo = data.deliveredTo || [];
        const readBy = data.readBy || [];
        
        // Calculate status for current user's own messages
        const status = calculateMessageStatus(senderId, currentUserId, deliveredTo, readBy);
        
        return {
          id: doc.id,
          conversationId,
          text: data.text || '',
          senderId,
          senderName: sender?.name,
          senderAvatarColor: sender?.avatarColor,
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toMillis() 
            : Date.now(),
          status,
          deliveredTo,
          readBy,
        };
      });
      
      // Update UI (from Firestore)
      setMessages(msgs.map(({ conversationId, ...rest }) => rest));
    });

    return () => {
      unsubscribeMessages();
    };
  }, [conversationId, currentUserId, users]);

  return messages;
}



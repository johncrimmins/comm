import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';

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
      
      // Process incoming messages and update delivery status
      for (const change of docChanges) {
        if (change.type === 'added' && currentUserId) {
          const data = change.doc.data();
          const senderId = data.senderId || '';
          
          // If this is not our own message, update delivery status
          if (senderId !== currentUserId) {
            try {
              const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
              
              // Use setDoc with merge to handle both creation and update
              await setDoc(stateRef, {
                [`delivery.lastDeliveredAt.${currentUserId}`]: Timestamp.now(),
              }, { merge: true });
            } catch (error) {
              // Silent failure for delivery status updates
            }
          }
        }
      }
      
      // Map all messages to state with sender names
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const senderId = data.senderId || '';
        const sender = users[senderId];
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
          status: (data.status as 'sent' | 'delivered' | 'read' | null) ?? null,
        };
      });
      
      // Update UI (from Firestore)
      setMessages(msgs.map(({ conversationId, ...rest }) => rest));
    });

    // Set up real-time listener for state (delivery and read markers)
    const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
    const unsubscribeState = onSnapshot(stateRef, async (stateSnap) => {
      if (!stateSnap.exists() || !currentUserId) {
        return;
      }
      
      const stateData = stateSnap.data();
      const delivery = stateData?.delivery?.lastDeliveredAt || {};
      const read = stateData?.read?.lastReadAt || {};
      
      // Update message statuses based on state markers
      setMessages((prevMessages) => {
        const updated = prevMessages.map((msg) => {
          // Only update status for messages we sent
          if (msg.senderId !== currentUserId) {
            return msg;
          }
          
          let newStatus: 'sent' | 'delivered' | 'read' | null = msg.status;
          
          // Get all other user IDs
          const otherUserIds = Object.keys(delivery).filter((uid) => uid !== currentUserId);
          
          if (otherUserIds.length > 0) {
            // Check delivery status - update to delivered if any recipient has delivered
            const deliveredAt = otherUserIds
              .map((uid) => delivery[uid])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
              .sort((a, b) => b - a)[0]; // Get most recent delivery time
            
            if (deliveredAt && msg.createdAt <= deliveredAt) {
              newStatus = 'delivered';
            }
            
            // Check read status - update to read if all recipients have read
            const readAt = otherUserIds
              .map((uid) => read[uid])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
              .sort((a, b) => b - a)[0]; // Get most recent read time
            
            if (readAt && msg.createdAt <= readAt) {
              newStatus = 'read';
            }
          }
          
          // Only return new object if status changed
          if (newStatus !== msg.status) {
            return { ...msg, status: newStatus };
          }
          
          return msg;
        });
        
        return updated;
      });
    });

    return () => {
      unsubscribeMessages();
      unsubscribeState();
    };
  }, [conversationId, currentUserId, users]);

  return messages;
}



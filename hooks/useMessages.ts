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
      createdAt: number;
      status: 'sent' | 'delivered' | 'read' | null;
    }>
  );
  
  const currentUser = useAuthUser();
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    console.log(`📨 [useMessages] Setting up listeners for conversation: ${conversationId}`);
    
    // Query Firestore messages subcollection for this conversation
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // Set up real-time listener for messages
    const unsubscribeMessages = onSnapshot(q, async (snapshot) => {
      const docChanges = snapshot.docChanges();
      
      console.log(`📨 [useMessages] Received ${docChanges.length} message changes for conversation ${conversationId}`);
      
      // Process incoming messages and update delivery status
      for (const change of docChanges) {
        if (change.type === 'added' && currentUserId) {
          const data = change.doc.data();
          const senderId = data.senderId || '';
          
          // If this is not our own message, update delivery status
          if (senderId !== currentUserId) {
            console.log(`✅ [useMessages] New message received from ${senderId}, updating delivery status`);
            try {
              const stateRef = doc(db, 'conversations', conversationId, 'state', 'state');
              
              // Use setDoc with merge to handle both creation and update
              await setDoc(stateRef, {
                [`delivery.lastDeliveredAt.${currentUserId}`]: Timestamp.now(),
              }, { merge: true });
              
              console.log(`✓ [useMessages] Delivery status updated for user ${currentUserId}`);
            } catch (error) {
              console.error(`❌ [useMessages] Error updating delivery status:`, error);
            }
          }
        }
      }
      
      // Map all messages to state
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          conversationId,
          text: data.text || '',
          senderId: data.senderId || '',
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
        console.log(`⚠️ [useMessages] State document doesn't exist or no current user`);
        return;
      }
      
      const stateData = stateSnap.data();
      const delivery = stateData?.delivery?.lastDeliveredAt || {};
      const read = stateData?.read?.lastReadAt || {};
      
      console.log(`📊 [useMessages] State updated - delivery:`, Object.keys(delivery), `read:`, Object.keys(read));
      
      // Update message statuses based on state markers
      setMessages((prevMessages) => {
        let statusChanges = 0;
        const updated = prevMessages.map((msg) => {
          // Only update status for messages we sent
          if (msg.senderId !== currentUserId) {
            return msg;
          }
          
          let newStatus: 'sent' | 'delivered' | 'read' | null = msg.status;
          
          // Get all other user IDs
          const otherUserIds = Object.keys(delivery).filter((uid) => uid !== currentUserId);
          
          console.log(`🔍 [useMessages] Checking status for message ${msg.id.substring(0, 8)}... (current: ${msg.status}, otherUserIds: ${otherUserIds.length})`);
          
          if (otherUserIds.length > 0) {
            // Check delivery status - update to delivered if any recipient has delivered
            const deliveredAt = otherUserIds
              .map((uid) => delivery[uid])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
              .sort((a, b) => b - a)[0]; // Get most recent delivery time
            
            console.log(`📦 [useMessages] Message ${msg.id.substring(0, 8)}... createdAt=${msg.createdAt}, deliveredAt=${deliveredAt}`);
            
            if (deliveredAt && msg.createdAt <= deliveredAt) {
              newStatus = 'delivered';
              console.log(`✓ [useMessages] Message ${msg.id.substring(0, 8)}... STATUS CHANGED: ${msg.status} → delivered`);
              statusChanges++;
            }
            
            // Check read status - update to read if all recipients have read
            const readAt = otherUserIds
              .map((uid) => read[uid])
              .filter((t): t is Timestamp => t instanceof Timestamp)
              .map((t) => t.toMillis())
              .sort((a, b) => b - a)[0]; // Get most recent read time
            
            console.log(`👁️ [useMessages] Message ${msg.id.substring(0, 8)}... createdAt=${msg.createdAt}, readAt=${readAt}`);
            
            if (readAt && msg.createdAt <= readAt) {
              newStatus = 'read';
              console.log(`✓ [useMessages] Message ${msg.id.substring(0, 8)}... STATUS CHANGED: ${msg.status} → read`);
              statusChanges++;
            }
          }
          
          // Only return new object if status changed
          if (newStatus !== msg.status) {
            return { ...msg, status: newStatus };
          }
          
          return msg;
        });
        
        if (statusChanges > 0) {
          console.log(`📊 [useMessages] Updated ${statusChanges} message statuses`);
        }
        
        return updated;
      });
    });

    return () => {
      unsubscribeMessages();
      unsubscribeState();
    };
  }, [conversationId, currentUserId]);

  return messages;
}



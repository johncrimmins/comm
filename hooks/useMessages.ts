import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

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

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    // Query Firestore messages subcollection for this conversation
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const message = {
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId || '',
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toMillis() 
            : Date.now(),
          status: (data.status as 'sent' | 'delivered' | 'read' | null) ?? null,
        };
        
        // Log status changes
        if (message.status) {
          console.log(`📬 [useMessages] Message status: id=${message.id}, status=${message.status}, text="${message.text.substring(0, 20)}..."`);
        }
        
        return message;
      });
      
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return messages;
}



import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';
import { saveConversation } from '@/lib/db/access';

export type ConversationPreviewUI = {
  id: string;
  displayName: string; // placeholder; real names come from participants in future epic
  lastMessage: string | null;
  timestamp: string | null;
  unread: boolean;
  avatarColor?: string;
};

function formatTime(ms: number | null | undefined): string | null {
  if (!ms) return null;
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function useConversations(): ConversationPreviewUI[] {
  const user = useAuthUser();
  const [items, setItems] = useState<ConversationPreviewUI[]>([]);

  const userId = user?.uid ?? null;

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    
    // Query Firestore for conversations where user is a participant
    // Note: Removed orderBy to avoid index requirement. We'll sort in memory.
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversations: ConversationPreviewUI[] = [];

      // Process conversations in parallel
      const conversationPromises = snapshot.docs.map(async (doc, index) => {
        const conversationId = doc.id;

        // For MVP, we'll fetch last message synchronously
        // This keeps it simple - we can optimize later with caching
        let lastMessageText: string | null = null;
        let lastMessageAt: number | null = null;

        try {
          const messagesRef = collection(db, 'conversations', conversationId, 'messages');
          const lastMsgQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
          
          // Use getDocs for a one-time fetch
          const { getDocs } = await import('firebase/firestore');
          const lastMsgSnapshot = await getDocs(lastMsgQuery);
          
          if (!lastMsgSnapshot.empty) {
            const lastMsg = lastMsgSnapshot.docs[0].data();
            lastMessageText = lastMsg.text || null;
            lastMessageAt = lastMsg.createdAt instanceof Timestamp 
              ? lastMsg.createdAt.toMillis() 
              : null;
          }
        } catch (e) {
          console.error('Error fetching last message:', e);
        }

        const conversation = {
          id: conversationId,
          displayName: `conversation ${index + 1}`,
          lastMessage: lastMessageText,
          timestamp: formatTime(lastMessageAt),
          unread: false, // TODO: Calculate unread count from receipts
          lastMessageAt: lastMessageAt, // Store raw timestamp for sorting
        };
        
        return conversation;
      });

      const resolvedConversations = await Promise.all(conversationPromises);
      
      // Sort by lastMessageAt descending (most recent first)
      const sortedConversations = resolvedConversations.sort((a, b) => {
        const timeA = a.lastMessageAt || 0;
        const timeB = b.lastMessageAt || 0;
        return timeB - timeA;
      });
      
      // Remove lastMessageAt field (not part of ConversationPreviewUI type)
      const finalConversations = sortedConversations.map(({ lastMessageAt, ...rest }) => rest);
      
      // Update UI (from Firestore)
      setItems(finalConversations);
      
      // Write to SQLite cache (write-through)
      try {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          participantIds: doc.data().participantIds || [],
          createdAt: doc.data().createdAt instanceof Timestamp 
            ? doc.data().createdAt.toMillis() 
            : Date.now(),
          updatedAt: doc.data().updatedAt instanceof Timestamp 
            ? doc.data().updatedAt.toMillis() 
            : Date.now(),
        }));
        
        for (const conv of conversations) {
          await saveConversation(conv);
        }
        console.log(`💾 [useConversations] Cached ${conversations.length} conversations to SQLite`);
      } catch (error) {
        console.error(`❌ [useConversations] Error caching conversations:`, error);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return items;
}



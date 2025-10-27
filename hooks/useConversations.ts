import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';

export type ConversationPreviewUI = {
  id: string;
  displayName: string;
  lastMessage: string | null;
  timestamp: string | null;
  avatarColor?: string;
  title?: string;
  unreadCount?: number;
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

      // Fetch all users once for name lookup
      const { getDocs: getDocsFn } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocsFn(usersRef);
      const usersMap: Record<string, string> = {};
      usersSnapshot.docs.forEach((doc: any) => {
        usersMap[doc.id] = doc.data().name || 'user';
      });

      // Process conversations in parallel
      const conversationPromises = snapshot.docs
        .filter(doc => {
          // Exclude AI conversations (they're shown as sticky header)
          const data = doc.data();
          return !data.participantIds.includes('ai-assistant');
        })
        .map(async (doc, index) => {
        const conversationId = doc.id;
        const data = doc.data();
        const participantIds = data.participantIds || [];
        const title = data.title;

        // Generate display name from participant names
        const participantNames = participantIds
          .filter((id: string) => id !== userId) // Exclude current user
          .map((id: string) => usersMap[id] || 'user')
          .slice(0, 3); // Limit to 3 names for display
        
        let displayName = 'conversation';
        if (participantNames.length === 1) {
          displayName = participantNames[0];
        } else if (participantNames.length === 2) {
          displayName = `${participantNames[0]} & ${participantNames[1]}`;
        } else if (participantNames.length > 2) {
          displayName = `${participantNames[0]}, ${participantNames[1]} & ${participantNames.length - 2} more`;
        }

        // For MVP, we'll fetch last message synchronously
        // This keeps it simple - we can optimize later with caching
        let lastMessageText: string | null = null;
        let lastMessageAt: number | null = null;
        let unreadCount = 0;

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

          // Count unread messages (messages from others not in readBy array)
          const allMessagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'asc')));
          unreadCount = allMessagesSnapshot.docs.filter(doc => {
            const data = doc.data();
            const readBy = data.readBy || [];
            const senderId = data.senderId;
            // Count if message is from someone else and user hasn't read it
            return senderId !== userId && !readBy.includes(userId);
          }).length;
        } catch (e) {
          // Silent failure for message fetching
        }

        const conversation = {
          id: conversationId,
          displayName: displayName,
          lastMessage: lastMessageText,
          timestamp: formatTime(lastMessageAt),
          lastMessageAt: lastMessageAt, // Store raw timestamp for sorting
          title: title,
          unreadCount: unreadCount > 0 ? unreadCount : undefined,
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
    });

    return () => unsubscribe();
  }, [userId]);

  return items;
}



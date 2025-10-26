import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

export type ConversationData = {
  participantIds: string[];
  createdAt?: any;
  updatedAt?: any;
};

/**
 * Hook to get conversation data by ID
 */
export function useConversation(conversationId: string): ConversationData | null {
  const [conversation, setConversation] = useState<ConversationData | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    const conversationRef = doc(db, 'conversations', conversationId);
    const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        setConversation(snapshot.data() as ConversationData);
      } else {
        setConversation(null);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  return conversation;
}


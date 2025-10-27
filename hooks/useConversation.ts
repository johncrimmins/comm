import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';

export type ConversationData = {
  participantIds: string[];
  title?: string;
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
        const data = snapshot.data();
        setConversation({
          participantIds: data.participantIds || [],
          title: data.title || undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } else {
        setConversation(null);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  return conversation;
}


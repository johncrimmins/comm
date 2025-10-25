import { useEffect, useState } from 'react';
import { listMessagesByConversation } from '@/lib/sqlite';
import { setActiveConversationId } from '@/lib/sync';

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
    let cancelled = false;
    setActiveConversationId(conversationId);
    async function load() {
      const rows = await listMessagesByConversation(conversationId);
      if (cancelled) return;
      setMessages(
        rows.map((m) => ({
          id: m.id,
          text: m.text,
          senderId: m.senderId,
          createdAt: m.createdAt,
          status: (m.status as any) ?? null,
        }))
      );
    }
    load();
    // Note: No polling needed. Firestore listeners via sync engine keep SQLite updated.
    // For now, we load once. Future: Add reactive updates when SQLite changes.
    return () => {
      cancelled = true;
      setActiveConversationId(null);
    };
  }, [conversationId]);

  return messages;
}



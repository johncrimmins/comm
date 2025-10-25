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
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    setActiveConversationId(conversationId);
    async function tick() {
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
    tick();
    timer = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      setActiveConversationId(null);
    };
  }, [conversationId]);

  return messages;
}



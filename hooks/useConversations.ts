import { useEffect, useMemo, useState } from 'react';
import { listConversationsWithPreview } from '@/lib/sqlite';
import { useAuthUser } from '@/hooks/useAuth';

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
    let cancelled = false;
    async function load() {
      if (!userId) {
        setItems([]);
        return;
      }
      const rows = await listConversationsWithPreview(userId);
      if (cancelled) return;
      const mapped: ConversationPreviewUI[] = rows.map((r, idx) => ({
        id: r.id,
        displayName: `conversation ${idx + 1}`,
        lastMessage: r.lastMessageText ?? null,
        timestamp: formatTime(r.lastMessageAt ?? null),
        unread: (r.unreadCount ?? 0) > 0,
      }));
      setItems(mapped);
    }
    load();
    // Note: No polling needed. Firestore listeners via sync engine keep SQLite updated.
    // For now, we load once. Future: Add reactive updates when SQLite changes.
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return items;
}



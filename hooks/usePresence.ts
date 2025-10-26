import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';
import { isOnline } from '@/services/presence';

/**
 * Hook to track presence of other users in a conversation
 * Returns "online" or "offline" for 1-on-1 chats
 * Returns "X online · Y members" for group chats
 */
export function usePresence(conversationId: string, participantIds: string[]): string {
  const [status, setStatus] = useState<string>('offline');
  const currentUser = useAuthUser();
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!conversationId || !currentUserId || participantIds.length === 0) {
      setStatus('offline');
      return;
    }

    // Filter out current user from participants
    const otherUserIds = participantIds.filter(id => id !== currentUserId);
    
    if (otherUserIds.length === 0) {
      setStatus('offline');
      return;
    }

    // For 1-on-1 chats, listen to the other user's presence
    if (otherUserIds.length === 1) {
      const otherUserId = otherUserIds[0];
      const userRef = doc(db, 'users', otherUserId);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          setStatus('offline');
          return;
        }

        const data = snapshot.data();
        const lastSeen = data.lastSeen as Timestamp | null | undefined;
        
        setStatus(isOnline(lastSeen) ? 'online' : 'offline');
      });

      return () => unsubscribe();
    }

    // For group chats, listen to all participants' presence
    const totalCount = otherUserIds.length;
    const onlineMap = new Map<string, boolean>();
    const unsubscribes: (() => void)[] = [];

    const updateStatus = () => {
      const onlineCount = Array.from(onlineMap.values()).filter(v => v).length;
      setStatus(`${onlineCount} online · ${totalCount} members`);
    };

    otherUserIds.forEach((userId) => {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          onlineMap.set(userId, false);
          updateStatus();
          return;
        }

        const data = snapshot.data();
        const lastSeen = data.lastSeen as Timestamp | null | undefined;
        const online = isOnline(lastSeen);
        
        onlineMap.set(userId, online);
        updateStatus();
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [conversationId, currentUserId, participantIds.join(',')]);

  return status;
}


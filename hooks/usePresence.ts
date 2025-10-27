import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';
import { isOnline } from '@/services/presence';

export type PresenceState = {
  status: string;
  isTyping: boolean;
};

/**
 * Hook to track presence and typing status of other users in a conversation
 * Returns "online" or "offline" for 1-on-1 chats
 * Returns "X online · Y members" for group chats
 * Also returns whether the other user is typing
 */
export function usePresence(conversationId: string, participantIds: string[]): PresenceState {
  const [presence, setPresence] = useState<PresenceState>({ status: 'offline', isTyping: false });
  const currentUser = useAuthUser();
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!conversationId || !currentUserId || participantIds.length === 0) {
      setPresence({ status: 'offline', isTyping: false });
      return;
    }

    // Filter out current user from participants
    const otherUserIds = participantIds.filter(id => id !== currentUserId);
    
    if (otherUserIds.length === 0) {
      setPresence({ status: 'offline', isTyping: false });
      return;
    }

    // For 1-on-1 chats, listen to the other user's presence
    if (otherUserIds.length === 1) {
      const otherUserId = otherUserIds[0];
      
      // AI assistant is always online
      if (otherUserId === 'ai-assistant') {
        setPresence({ status: 'online', isTyping: false });
        return;
      }
      
      const userRef = doc(db, 'users', otherUserId);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          setPresence({ status: 'offline', isTyping: false });
          return;
        }

        const data = snapshot.data();
        const lastSeen = data.lastSeen as Timestamp | null | undefined;
        const currentlyTypingIn = data.currentlyTypingIn as string | null | undefined;
        
        const status = isOnline(lastSeen) ? 'online' : 'offline';
        const isTyping = currentlyTypingIn === conversationId;
        
        setPresence({ status, isTyping });
      });

      return () => unsubscribe();
    }

    // For group chats, listen to all participants' presence
    const totalCount = otherUserIds.length;
    const onlineMap = new Map<string, boolean>();
    const typingMap = new Map<string, boolean>();
    const unsubscribes: (() => void)[] = [];

    const updateStatus = () => {
      const onlineCount = Array.from(onlineMap.values()).filter(v => v).length;
      const typingCount = Array.from(typingMap.values()).filter(v => v).length;
      const status = `${onlineCount} online · ${totalCount} members`;
      const isTyping = typingCount > 0;
      
      setPresence({ status, isTyping });
    };

    otherUserIds.forEach((userId) => {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          onlineMap.set(userId, false);
          typingMap.set(userId, false);
          updateStatus();
          return;
        }

        const data = snapshot.data();
        const lastSeen = data.lastSeen as Timestamp | null | undefined;
        const currentlyTypingIn = data.currentlyTypingIn as string | null | undefined;
        const online = isOnline(lastSeen);
        const isTyping = currentlyTypingIn === conversationId;
        
        onlineMap.set(userId, online);
        typingMap.set(userId, isTyping);
        updateStatus();
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [conversationId, currentUserId, participantIds.join(',')]);

  return presence;
}


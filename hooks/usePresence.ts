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
    console.log(`🔍 [usePresence] Initializing: conversationId=${conversationId}, currentUserId=${currentUserId}, participantIds=${participantIds.join(',')}`);
    
    if (!conversationId || !currentUserId || participantIds.length === 0) {
      console.log(`🔍 [usePresence] Missing required data, returning`);
      setPresence({ status: 'offline', isTyping: false });
      return;
    }

    // Filter out current user from participants
    const otherUserIds = participantIds.filter(id => id !== currentUserId);
    
    console.log(`🔍 [usePresence] Other user IDs: ${otherUserIds.join(',')}`);
    
    if (otherUserIds.length === 0) {
      console.log(`🔍 [usePresence] No other users, returning`);
      setPresence({ status: 'offline', isTyping: false });
      return;
    }

    // For 1-on-1 chats, listen to the other user's presence
    if (otherUserIds.length === 1) {
      const otherUserId = otherUserIds[0];
      console.log(`🔍 [usePresence] Setting up 1-on-1 listener for user: ${otherUserId}`);
      const userRef = doc(db, 'users', otherUserId);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        console.log(`🔍 [usePresence] onSnapshot fired for user ${otherUserId}`);
        if (!snapshot.exists()) {
          setPresence({ status: 'offline', isTyping: false });
          return;
        }

        const data = snapshot.data();
        const lastSeen = data.lastSeen as Timestamp | null | undefined;
        const currentlyTypingIn = data.currentlyTypingIn as string | null | undefined;
        
        const status = isOnline(lastSeen) ? 'online' : 'offline';
        const isTyping = currentlyTypingIn === conversationId;
        
        console.log(`👁️ [usePresence] 1-on-1: currentlyTypingIn=${currentlyTypingIn}, conversationId=${conversationId}, isTyping=${isTyping}`);
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
        
        console.log(`👁️ [usePresence] Group chat user ${userId}: currentlyTypingIn=${currentlyTypingIn}, conversationId=${conversationId}, isTyping=${isTyping}`);
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


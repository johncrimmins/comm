import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { useAuthUser } from '@/hooks/useAuth';

/**
 * Hook to show local notifications for new messages in conversations OTHER than the current one
 * Tracks last notification time per conversation to avoid duplicate notifications
 */
export function useNotifications(currentConversationId: string | null) {
  const user = useAuthUser();
  const userId = user?.uid;
  
  // Track last notification time per conversation
  const lastNotificationTimeRef = useRef<Record<string, number>>({});
  // Track message listeners for cleanup
  const messageListenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    
    // Skip notifications on web platform
    if (Platform.OS === 'web') {
      return;
    }

    // Request permissions once
    Notifications.requestPermissionsAsync();

    // Query all conversations where user is a participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participantIds', 'array-contains', userId));

    const unsubscribeConversations = onSnapshot(q, (snapshot) => {
      // Clean up existing message listeners
      messageListenersRef.current.forEach(unsub => unsub());
      messageListenersRef.current = [];

      // Process each conversation
      snapshot.docs.forEach((convDoc) => {
        const conversationId = convDoc.id;
        
        // Skip current conversation - don't notify for messages in the chat user is viewing
        if (conversationId === currentConversationId) {
          return;
        }

        // Listen to messages in this conversation
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const unsubscribeMessages = onSnapshot(messagesRef, (messagesSnapshot) => {
          if (messagesSnapshot.empty) return;

          // Track if this is the first load
          const isFirstLoad = !lastNotificationTimeRef.current[conversationId];
          
          if (isFirstLoad) {
            // On first load, set the timestamp of the most recent message to avoid notifying for old messages
            const lastMessage = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
            const messageData = lastMessage.data();
            const messageCreatedAt = messageData.createdAt instanceof Timestamp
              ? messageData.createdAt.toMillis()
              : Date.now();
            lastNotificationTimeRef.current[conversationId] = messageCreatedAt;
            return;
          }

          // Check for NEW messages using docChanges
          const changes = messagesSnapshot.docChanges();
          
          changes.forEach((change) => {
            if (change.type === 'added') {
              const messageData = change.doc.data();
              const messageCreatedAt = messageData.createdAt instanceof Timestamp
                ? messageData.createdAt.toMillis()
                : Date.now();
              const senderId = messageData.senderId;
              const deliveredTo = messageData.deliveredTo || [];

              // TRIPLE-CHECK: Skip notifications for user's own messages
              // Check 1: Compare senderId
              if (senderId === userId) {
                console.log('[Notifications] Skipping own message (senderId check):', { senderId, userId });
                return;
              }

              // Check 2: If user is in deliveredTo array, they already have this message
              if (deliveredTo.includes(userId)) {
                console.log('[Notifications] Skipping own message (deliveredTo check):', { senderId, userId, deliveredTo });
                return;
              }

              // Check 3: Ensure userId is defined and not empty
              if (!userId || userId === '') {
                console.log('[Notifications] Skipping message (no userId):', { senderId, userId });
                return;
              }

              // Get last notification time for this conversation
              const lastNotificationTime = lastNotificationTimeRef.current[conversationId] || 0;

              // Skip if message is older than last notification time (already notified)
              if (messageCreatedAt <= lastNotificationTime) {
                console.log('[Notifications] Skipping old message:', { messageCreatedAt, lastNotificationTime });
                return;
              }

              // Update last notification time
              lastNotificationTimeRef.current[conversationId] = messageCreatedAt;

              // Show notification
              console.log('[Notifications] Scheduling notification for:', { senderId, userId, text: messageData.text?.substring(0, 20) });
              Notifications.scheduleNotificationAsync({
                content: {
                  title: 'New message',
                  body: messageData.text || 'You have a new message',
                  sound: true,
                },
                trigger: null, // Show immediately
              });
            }
          });
        });

        // Store listener for cleanup
        messageListenersRef.current.push(unsubscribeMessages);
      });
    });

    return () => {
      unsubscribeConversations();
      messageListenersRef.current.forEach(unsub => unsub());
    };
  }, [userId, currentConversationId]);
}


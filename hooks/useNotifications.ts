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
    console.log(`[Notifications] Hook initialized:`, {
      userId,
      currentConversationId,
      platform: Platform.OS,
    });

    if (!userId) {
      console.log(`[Notifications] No userId, returning`);
      return;
    }
    
    // Skip notifications on web platform
    if (Platform.OS === 'web') {
      console.log(`[Notifications] Web platform detected, skipping`);
      return;
    }

    // Request permissions once
    Notifications.requestPermissionsAsync();

    // Query all conversations where user is a participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participantIds', 'array-contains', userId));

    const unsubscribeConversations = onSnapshot(q, (snapshot) => {
      console.log(`[Notifications] Conversations snapshot:`, {
        totalConversations: snapshot.docs.length,
        currentConvId: currentConversationId,
      });

      // Clean up existing message listeners
      messageListenersRef.current.forEach(unsub => unsub());
      messageListenersRef.current = [];

      // Process each conversation
      snapshot.docs.forEach((convDoc) => {
        const conversationId = convDoc.id;
        
        // Skip current conversation - don't notify for messages in the chat user is viewing
        if (conversationId === currentConversationId) {
          console.log(`[Notifications] Skipping current conversation ${conversationId}`);
          return;
        }
        
        console.log(`[Notifications] Setting up listener for conversation ${conversationId}`);

        // Listen to messages in this conversation
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const unsubscribeMessages = onSnapshot(messagesRef, (messagesSnapshot) => {
          console.log(`[Notifications] Messages snapshot for conv ${conversationId}:`, {
            totalDocs: messagesSnapshot.docs.length,
            isEmpty: messagesSnapshot.empty,
          });

          if (messagesSnapshot.empty) return;

          // Track if this is the first load
          const isFirstLoad = !lastNotificationTimeRef.current[conversationId];
          
          if (isFirstLoad) {
            console.log(`[Notifications] First load for conv ${conversationId}, initializing timestamp`);
            // On first load, set the timestamp of the most recent message to avoid notifying for old messages
            const lastMessage = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
            const messageData = lastMessage.data();
            const messageCreatedAt = messageData.createdAt instanceof Timestamp
              ? messageData.createdAt.toMillis()
              : Date.now();
            lastNotificationTimeRef.current[conversationId] = messageCreatedAt;
            console.log(`[Notifications] Set initial timestamp to ${messageCreatedAt}`);
            return;
          }

          // Check for NEW messages using docChanges
          const changes = messagesSnapshot.docChanges();
          console.log(`[Notifications] Processing ${changes.length} doc changes for conv ${conversationId}`);
          
          changes.forEach((change) => {
            if (change.type === 'added') {
              const messageData = change.doc.data();
              const messageCreatedAt = messageData.createdAt instanceof Timestamp
                ? messageData.createdAt.toMillis()
                : Date.now();
              const senderId = messageData.senderId;

              console.log(`[Notifications] New message detected:`, {
                convId: conversationId,
                senderId,
                createdAt: messageCreatedAt,
                text: messageData.text?.substring(0, 30),
              });

              // Skip notifications for user's own messages
              if (senderId === userId) {
                console.log(`[Notifications] Skipping own message`);
                return;
              }

              // Show notification
              console.log(`[Notifications] Showing notification for message`);
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


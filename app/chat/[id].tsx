import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  AppState,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Message as MessageType } from '@/components/chat/Message';
import { useMessages } from '@/hooks/useMessages';
import { sendMessage, markRead } from '@/services/chat';
import { updatePresence, setTyping, clearTyping } from '@/services/presence';
import { sendAIMessage, isAIConversation } from '@/services/aiChat';
import GradientBackground from '@/components/ui/GradientBackground';
import { useAuthUser } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { usePresence } from '@/hooks/usePresence';
import { useNotifications } from '@/hooks/useNotifications';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessages } from '@/components/chat/ChatMessages';

// Removed mock conversation data; using Firestore-driven messages via useMessages

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { id, groupName, isGroup } = params;
  const router = useRouter();
  const flatListRef = useRef<FlatList<MessageType> | null>(null);
  const user = useAuthUser();
  const uid = user?.uid;

  const isGroupChat = isGroup === 'true' || (typeof id === 'string' && id.startsWith('group_'));

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Replace mock messages with Firestore-driven list if id is provided
  const convId = (Array.isArray(id) ? id[0] : (id as string | undefined)) ?? '';
  const messagesFromFirestore = useMessages(convId || '');
  const conversation = useConversation(convId);
  const presence = usePresence(convId, conversation?.participantIds || []);
  
  // Detect if this is an AI conversation
  const isAI = conversation ? isAIConversation(conversation.participantIds) : false;
  
  // Initialize notifications for conversations OTHER than the current one
  useNotifications(convId || null);
  useEffect(() => {
    if (!convId) {
      setMessages([]);
      return;
    }
    setMessages(
      messagesFromFirestore.map((m) => ({
        id: m.id,
        text: m.text,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        senderId: m.senderId,
        senderName: m.senderName,
        senderAvatarColor: m.senderAvatarColor,
        isCurrentUser: !!uid && m.senderId === uid,
        status: (m.status as any) ?? null,
      }))
    );
  }, [convId, uid, messagesFromFirestore]);

  // Mark read on open and update presence
  useEffect(() => {
    if (!convId || !uid) return;
    markRead(convId, uid).catch(() => {});
    updatePresence(uid).catch(() => {});
  }, [convId, uid]);

  // Update presence when app comes to foreground
  useEffect(() => {
    if (!uid) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updatePresence(uid).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [uid]);

  const handleSend = async () => {
    if (!convId || !uid) return;
    if (inputText.trim()) {
      if (isAI) {
        // Use AI service for AI conversations
        await sendAIMessage(convId, inputText.trim(), uid);
      } else {
        // Use regular chat service for normal conversations
        await sendMessage(convId, inputText.trim(), uid);
      }
      setInputText('');
      clearTyping(uid).catch(() => {});
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (!convId || !uid) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing status
    if (text.trim()) {
      setTyping(uid, convId).catch(() => {});
      
      // Clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        clearTyping(uid).catch(() => {});
        typingTimeoutRef.current = null;
      }, 3000);
    } else {
      clearTyping(uid).catch(() => {});
    }
  };

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (uid) {
        clearTyping(uid).catch(() => {});
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [uid]);

  // Get conversation title
  const conversationTitle = isAI
    ? 'Chat with Comms (AI)'
    : conversation?.title || (isGroupChat 
      ? ((Array.isArray(groupName) ? groupName[0] : groupName) || 'group chat')
      : (convId || 'chat'));

  // Get presence subtitle
  const presenceSubtitle = presence.isTyping ? 'typing...' : presence.status;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />

        <ChatHeader
          onBack={() => router.back()}
          title={conversationTitle}
          subtitle={presenceSubtitle}
        />

        <ChatMessages
          messages={messages}
          isGroupChat={isGroupChat}
          flatListRef={flatListRef}
        />

        <ChatInput
          inputText={inputText}
          onChangeText={handleInputChange}
          onSend={handleSend}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

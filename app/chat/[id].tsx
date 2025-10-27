import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  AppState,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Message as MessageType } from '@/components/chat/Message';
import { useMessages } from '@/hooks/useMessages';
import { sendMessage, markRead, updateConversationTitle } from '@/services/chat';
import { updatePresence, setTyping, clearTyping } from '@/services/presence';
import { sendAIMessage, isAIConversation } from '@/services/aiChat';
import GradientBackground from '@/components/ui/GradientBackground';
import { useAuthUser } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { usePresence } from '@/hooks/usePresence';
import { useNotifications } from '@/hooks/useNotifications';
import { useUsers } from '@/hooks/useUsers';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { chatStyles } from '@/styles/screens/chat';

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
  const users = useUsers();
  
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

  const handleTitleChange = async (newTitle: string) => {
    if (!convId || !newTitle) return;
    try {
      await updateConversationTitle(convId, newTitle);
    } catch (error) {
      console.error('Failed to update conversation title:', error);
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

  // Get conversation title - use Firestore title, or generate from participant names
  const getConversationTitle = (): string => {
    if (isAI) return 'Chat with Comms (AI)';
    if (conversation?.title) return conversation.title;
    
    // Generate display name from participant names (same logic as conversation list)
    const participantIds = conversation?.participantIds || [];
    const usersMap: Record<string, string> = {};
    users.forEach(user => {
      usersMap[user.id] = user.name;
    });
    
    const participantNames = participantIds
      .filter((id: string) => id !== uid) // Exclude current user
      .map((id: string) => usersMap[id] || 'user')
      .slice(0, 3); // Limit to 3 names
    
    if (participantNames.length === 1) {
      return participantNames[0];
    } else if (participantNames.length === 2) {
      return `${participantNames[0]} & ${participantNames[1]}`;
    } else if (participantNames.length > 2) {
      return `${participantNames[0]}, ${participantNames[1]} & ${participantNames.length - 2} more`;
    }
    return 'Chat';
  };
  
  const conversationTitle = getConversationTitle();

  // Get presence subtitle
  const presenceSubtitle = presence.isTyping ? 'typing...' : presence.status;

  return (
    <GradientBackground>
      <SafeAreaView style={chatStyles.container} edges={['top']}>
        <StatusBar style="light" />

        <ChatHeader
          onBack={() => router.back()}
          title={conversationTitle}
          subtitle={presenceSubtitle}
          editable={!isAI}
          onTitleChange={handleTitleChange}
        />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ChatMessages
            messages={messages}
            isGroupChat={isGroupChat}
            flatListRef={flatListRef}
          />
        </TouchableWithoutFeedback>

        <ChatInput
          inputText={inputText}
          onChangeText={handleInputChange}
          onSend={handleSend}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}


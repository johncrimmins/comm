import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import Message, { Message as MessageType } from '@/components/chat/Message';
import { useMessages } from '@/hooks/useMessages';
import { sendMessageLocal, markRead } from '@/services/chat';
import { isSomeoneTyping, isAnyParticipantOnline } from '@/lib/sqlite';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';

type ConversationData = {
  id: string;
  name: string;
  status: string;
  messages: MessageType[];
};

const MOCK_CONVERSATIONS_DATA: Record<string, ConversationData> = {
  '1': {
    id: '1',
    name: 'sarah johnson',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'hey! how are you doing?',
        timestamp: '10:30 am',
        senderId: 'other',
        senderName: 'sarah johnson',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'i am doing great! thanks for asking.',
        timestamp: '10:31 am',
        senderId: 'me',
        isCurrentUser: true,
      },
      {
        id: '3',
        text: 'how about you?',
        timestamp: '10:31 am',
        senderId: 'me',
        isCurrentUser: true,
      },
      {
        id: '4',
        text: 'pretty good! just working on some projects.',
        timestamp: '10:32 am',
        senderId: 'other',
        senderName: 'sarah johnson',
        isCurrentUser: false,
      },
      {
        id: '5',
        text: 'that sounds exciting! what are you working on?',
        timestamp: '10:33 am',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'mike chen',
    status: 'active 2h ago',
    messages: [
      {
        id: '1',
        text: 'that sounds great! let me know when you are free.',
        timestamp: 'yesterday',
        senderId: 'other',
        senderName: 'mike chen',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'sure, i will let you know!',
        timestamp: 'yesterday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'emily davis',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'thanks for the help earlier 🙏',
        timestamp: 'tuesday',
        senderId: 'other',
        senderName: 'emily davis',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'no problem! happy to help.',
        timestamp: 'tuesday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '4': {
    id: '4',
    name: 'alex rodriguez',
    status: 'active yesterday',
    messages: [
      {
        id: '1',
        text: 'see you tomorrow!',
        timestamp: 'monday',
        senderId: 'other',
        senderName: 'alex rodriguez',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'see you!',
        timestamp: 'monday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '5': {
    id: '5',
    name: 'jessica lee',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'hi there!',
        timestamp: 'just now',
        senderId: 'other',
        senderName: 'jessica lee',
        isCurrentUser: false,
      },
    ],
  },
  '6': {
    id: '6',
    name: 'david kim',
    status: 'active 5h ago',
    messages: [
      {
        id: '1',
        text: 'hello!',
        timestamp: 'just now',
        senderId: 'other',
        senderName: 'david kim',
        isCurrentUser: false,
      },
    ],
  },
  '7': {
    id: '7',
    name: 'rachel martinez',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'hey!',
        timestamp: 'just now',
        senderId: 'other',
        senderName: 'rachel martinez',
        isCurrentUser: false,
      },
    ],
  },
  '8': {
    id: '8',
    name: 'tom wilson',
    status: 'active 1d ago',
    messages: [
      {
        id: '1',
        text: 'hi!',
        timestamp: 'just now',
        senderId: 'other',
        senderName: 'tom wilson',
        isCurrentUser: false,
      },
    ],
  },
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { id, groupName, isGroup } = params;
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const isGroupChat = isGroup === 'true' || (typeof id === 'string' && id.startsWith('group_'));

  const conversationData = useMemo(() => {
    const convId = Array.isArray(id) ? id[0] : id;
    
    // If it's a new group chat, create default data with welcome messages
    if (isGroupChat) {
      const participantNames = (Array.isArray(groupName) ? groupName[0] : groupName)?.split(', ') || [];
      const welcomeMessages: MessageType[] = participantNames.length > 0 ? [
        {
          id: '1',
          text: `welcome to the group! say hello 👋`,
          timestamp: 'just now',
          senderId: 'system',
          senderName: participantNames[0] || 'member',
          isCurrentUser: false,
        },
      ] : [];
      
      return {
        id: convId || 'new-group',
        name: (Array.isArray(groupName) ? groupName[0] : groupName) || 'group chat',
        status: 'active',
        messages: welcomeMessages,
      };
    }
    
    return MOCK_CONVERSATIONS_DATA[convId || '1'] || MOCK_CONVERSATIONS_DATA['1'];
  }, [id, groupName, isGroupChat]);

  const [messages, setMessages] = useState<MessageType[]>(conversationData.messages);
  const [headerStatus, setHeaderStatus] = useState<string>(conversationData.status);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setMessages(conversationData.messages);
  }, [conversationData]);

  // Replace mock messages with SQLite-driven list if id is provided
  const convId = (Array.isArray(id) ? id[0] : (id as string | undefined)) ?? '';
  const sqliteMessages = convId ? useMessages(convId) : [];
  useEffect(() => {
    if (!convId) return;
    setMessages(
      sqliteMessages.map((m) => ({
        id: m.id,
        text: m.text,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        senderId: m.senderId,
        isCurrentUser: m.senderId === 'me',
        status: (m.status as any) ?? null,
      }))
    );
  }, [convId, sqliteMessages]);

  // Typing + presence indicator
  useEffect(() => {
    if (!convId) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    async function tick() {
      const typing = await isSomeoneTyping(convId);
      if (cancelled) return;
      if (typing) {
        setHeaderStatus('typing…');
        return;
      }
      const online = await isAnyParticipantOnline(convId, 'me');
      if (cancelled) return;
      setHeaderStatus(online ? 'online' : conversationData.status);
    }
    tick();
    timer = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [convId, conversationData.status]);

  const handleSend = async () => {
    if (!convId) return;
    if (inputText.trim()) {
      await sendMessageLocal(convId, inputText.trim(), 'me');
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: MessageType }) => {
    // Show sender name in group chats for non-current-user messages
    const messageWithName = isGroupChat && !item.isCurrentUser 
      ? { ...item, senderName: item.senderName || 'member' }
      : item;
    
    return <Message message={messageWithName} />;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {conversationData.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isGroupChat 
                ? `${conversationData.name.split(', ').length} members` 
                : headerStatus}
            </Text>
          </View>
          <TouchableOpacity style={styles.aiButton} activeOpacity={0.8}>
            <Text style={styles.aiButtonText}>✨</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <GlassCard style={styles.inputCard} intensity={30}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="message..."
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.dark.text,
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginLeft: 8,
  },
  aiButtonText: {
    fontSize: 18,
  },
  messageList: {
    paddingVertical: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputCard: {
    borderRadius: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    boxShadow: [{ color: Colors.dark.glow, offsetX: 0, offsetY: 2, blurRadius: 8 }],
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark.border,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

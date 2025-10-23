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
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const conversationData = useMemo(() => {
    const convId = Array.isArray(id) ? id[0] : id;
    return MOCK_CONVERSATIONS_DATA[convId || '1'] || MOCK_CONVERSATIONS_DATA['1'];
  }, [id]);

  const [messages, setMessages] = useState<MessageType[]>(conversationData.messages);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setMessages(conversationData.messages);
  }, [conversationData]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: MessageType = {
        id: Date.now().toString(),
        text: inputText.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        senderId: 'me',
        isCurrentUser: true,
      };

      setMessages([...messages, newMessage]);
      setInputText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: MessageType }) => (
    <Message message={item} />
  );

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
            <Text style={styles.headerSubtitle}>{conversationData.status}</Text>
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
    shadowColor: Colors.dark.glow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark.border,
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

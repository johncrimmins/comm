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
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MessageBubble, { Message } from '@/components/chat/MessageBubble';

type ConversationData = {
  id: string;
  name: string;
  status: string;
  messages: Message[];
};

const MOCK_CONVERSATIONS_DATA: Record<string, ConversationData> = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'Hey! How are you doing?',
        timestamp: '10:30 AM',
        senderId: 'other',
        senderName: 'Sarah Johnson',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'I am doing great! Thanks for asking.',
        timestamp: '10:31 AM',
        senderId: 'me',
        isCurrentUser: true,
      },
      {
        id: '3',
        text: 'How about you?',
        timestamp: '10:31 AM',
        senderId: 'me',
        isCurrentUser: true,
      },
      {
        id: '4',
        text: 'Pretty good! Just working on some projects.',
        timestamp: '10:32 AM',
        senderId: 'other',
        senderName: 'Sarah Johnson',
        isCurrentUser: false,
      },
      {
        id: '5',
        text: 'That sounds exciting! What are you working on?',
        timestamp: '10:33 AM',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Mike Chen',
    status: 'Active 2h ago',
    messages: [
      {
        id: '1',
        text: 'That sounds great! Let me know when you are free.',
        timestamp: 'Yesterday',
        senderId: 'other',
        senderName: 'Mike Chen',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'Sure, I will let you know!',
        timestamp: 'Yesterday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Emily Davis',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'Thanks for the help earlier 🙏',
        timestamp: 'Tuesday',
        senderId: 'other',
        senderName: 'Emily Davis',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'No problem! Happy to help.',
        timestamp: 'Tuesday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '4': {
    id: '4',
    name: 'Alex Rodriguez',
    status: 'Active yesterday',
    messages: [
      {
        id: '1',
        text: 'See you tomorrow!',
        timestamp: 'Monday',
        senderId: 'other',
        senderName: 'Alex Rodriguez',
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'See you!',
        timestamp: 'Monday',
        senderId: 'me',
        isCurrentUser: true,
      },
    ],
  },
  '5': {
    id: '5',
    name: 'Jessica Lee',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'Hi there!',
        timestamp: 'Just now',
        senderId: 'other',
        senderName: 'Jessica Lee',
        isCurrentUser: false,
      },
    ],
  },
  '6': {
    id: '6',
    name: 'David Kim',
    status: 'Active 5h ago',
    messages: [
      {
        id: '1',
        text: 'Hello!',
        timestamp: 'Just now',
        senderId: 'other',
        senderName: 'David Kim',
        isCurrentUser: false,
      },
    ],
  },
  '7': {
    id: '7',
    name: 'Rachel Martinez',
    status: 'online',
    messages: [
      {
        id: '1',
        text: 'Hey!',
        timestamp: 'Just now',
        senderId: 'other',
        senderName: 'Rachel Martinez',
        isCurrentUser: false,
      },
    ],
  },
  '8': {
    id: '8',
    name: 'Tom Wilson',
    status: 'Active 1d ago',
    messages: [
      {
        id: '1',
        text: 'Hi!',
        timestamp: 'Just now',
        senderId: 'other',
        senderName: 'Tom Wilson',
        isCurrentUser: false,
      },
    ],
  },
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const flatListRef = useRef<FlatList>(null);

  const conversationData = useMemo(() => {
    const convId = Array.isArray(id) ? id[0] : id;
    return MOCK_CONVERSATIONS_DATA[convId || '1'] || MOCK_CONVERSATIONS_DATA['1'];
  }, [id]);

  const [messages, setMessages] = useState<Message[]>(conversationData.messages);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setMessages(conversationData.messages);
  }, [conversationData]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
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

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: colors.tint }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {conversationData.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{conversationData.status}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        style={{ backgroundColor: colors.background }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === 'dark' ? colors.secondary : '#F0F2F5',
                color: colors.text,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.icon}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.tint : colors.icon },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});

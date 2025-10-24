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
import { onMessages, sendMessage, ServiceMessage } from '@/services/chat';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const convId = useMemo(() => (Array.isArray(id) ? id[0] : (id as string) || ''), [id]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!convId) return;
    const unsub = onMessages(convId, (items: ServiceMessage[]) => {
      const mapped: MessageType[] = items.map((m) => ({
        id: (m.id as string) || Math.random().toString(),
        text: m.text,
        timestamp: '',
        senderId: m.senderId,
        isCurrentUser: m.senderId === 'me',
      }));
      setMessages(mapped);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => unsub();
  }, [convId]);

  const handleSend = () => {
    if (!convId) return;
    if (inputText.trim()) {
      sendMessage(convId, inputText.trim(), 'me');
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
              {convId || 'conversation'}
            </Text>
            <Text style={styles.headerSubtitle}></Text>
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

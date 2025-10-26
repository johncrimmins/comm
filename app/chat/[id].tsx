import React, { useState, useRef, useEffect } from 'react';
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
  AppState,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import Message, { Message as MessageType } from '@/components/chat/Message';
import { useMessages } from '@/hooks/useMessages';
import { sendMessage, markRead } from '@/services/chat';
import { updatePresence, setTyping, clearTyping } from '@/services/presence';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthUser } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { usePresence } from '@/hooks/usePresence';

// Removed mock conversation data; using Firestore-driven messages via useMessages

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { id, groupName, isGroup } = params;
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
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
  
  console.log(`📋 [ChatScreen] convId=${convId}, conversation=${JSON.stringify(conversation)}, participantIds=${conversation?.participantIds?.join(',') || 'undefined'}`);
  
  const presence = usePresence(convId, conversation?.participantIds || []);
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
      console.log(`⌨️ [handleSend] Sending message, clearing typing`);
      await sendMessage(convId, inputText.trim(), uid);
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
    
    if (!convId || !uid) {
      console.log(`⌨️ [handleInputChange] Missing convId or uid`);
      return;
    }
    
    console.log(`⌨️ [handleInputChange] Text length: ${text.length}, trimmed: ${text.trim().length}`);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing status
    if (text.trim()) {
      console.log(`⌨️ [handleInputChange] Setting typing status`);
      setTyping(convId, uid).catch(() => {});
      
      // Clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log(`⌨️ [handleInputChange] Auto-clearing typing after 3s`);
        clearTyping(uid).catch(() => {});
        typingTimeoutRef.current = null;
      }, 3000);
    } else {
      console.log(`⌨️ [handleInputChange] Input empty, clearing typing`);
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
              {isGroupChat ? ((Array.isArray(groupName) ? groupName[0] : groupName) || 'group chat') : (convId || 'chat')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {presence.isTyping ? 'typing...' : presence.status}
            </Text>
            {presence.isTyping && console.log(`📱 [ChatScreen] Rendering typing indicator`)}
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
                  onChangeText={handleInputChange}
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

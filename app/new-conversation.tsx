import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createOrFindConversation, sendMessage } from '@/services/chat';
import { useAuthUser } from '@/hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import EditableChipInput, { SelectedContact } from '@/components/conversation/EditableChipInput';
import { useUsers } from '@/hooks/useUsers';

type User = {
  id: string;
  name: string;
  avatarColor: string;
};

export default function NewConversationScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const allUsers = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [messageText, setMessageText] = useState('');

  const displayedUsers = useMemo(() => {
    const currentUserId = user?.uid;
    const base = allUsers.filter(u => u.id !== currentUserId);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(u => u.name.toLowerCase().includes(q));
  }, [searchQuery, allUsers, user]);

  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedContacts.map(c => c.id));
    return displayedUsers.filter(user => !selectedIds.has(user.id));
  }, [displayedUsers, selectedContacts]);

  const handleSelectContact = (user: User) => {
    setSelectedContacts([...selectedContacts, { id: user.id, name: user.name }]);
    setSearchQuery('');
  };

  const handleRemoveContact = (id: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== id));
  };

  const handleStartChat = async () => {
    if (selectedContacts.length === 0 || !messageText.trim()) return;
    
    // Guard: Fail fast if user is not authenticated
    if (!user?.uid) {
      Alert.alert(
        'Authentication Required',
        'You must be signed in to create conversations.',
        [{ text: 'OK', onPress: () => router.push('/(auth)') }]
      );
      return;
    }
    
    const senderId = user.uid;
    // Include sender in participantIds so Firebase query can find it for both users
    const participantIds = [senderId, ...selectedContacts.map(c => c.id)];
    const { conversationId } = await createOrFindConversation(participantIds);
    const { shouldNavigate } = await sendMessage(conversationId, messageText.trim(), senderId);
    setMessageText('');
    if (shouldNavigate) {
      router.push(`/chat/${conversationId}`);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleSelectContact(item)}
      activeOpacity={0.9}
      style={styles.userWrapper}
    >
      <GlassCard intensity={20} style={styles.userCard}>
        <View style={styles.userContent}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
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
            <Text style={styles.headerTitle}>new message</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <EditableChipInput
          selectedContacts={selectedContacts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRemoveContact={handleRemoveContact}
        />

        <FlatList
          data={availableUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.content}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.messageInputContainer}>
            <GlassCard style={styles.messageInputCard} intensity={30}>
              <View style={styles.messageInputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  placeholder={selectedContacts.length > 0 ? "imessage" : "select a contact to start messaging"}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                  editable={selectedContacts.length > 0}
                />
                {selectedContacts.length > 0 && (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleStartChat}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendIcon}>→</Text>
                  </TouchableOpacity>
                )}
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.dark.text,
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  userWrapper: {
    marginBottom: 4,
  },
  userCard: {
    overflow: 'hidden',
  },
  userContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  messageInputContainer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  messageInputCard: {
    borderRadius: 24,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    minHeight: 48,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

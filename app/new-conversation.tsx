import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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
import { ChatInput } from '@/components/chat/ChatInput';
import { newConversationStyles } from '@/styles/screens/newConversation';

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
    await sendMessage(conversationId, messageText.trim(), senderId);
    setMessageText('');
    // Always navigate to the chat screen after sending
    router.push(`/chat/${conversationId}`);
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleSelectContact(item)}
      activeOpacity={0.9}
      style={newConversationStyles.userWrapper}
    >
      <GlassCard intensity={20} style={newConversationStyles.userCard}>
        <View style={newConversationStyles.userContent}>
          <View style={[newConversationStyles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={newConversationStyles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={newConversationStyles.userInfo}>
            <Text style={newConversationStyles.userName}>{item.name}</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={newConversationStyles.container} edges={['top']}>
        <StatusBar style="light" />

        <View style={newConversationStyles.header}>
          <TouchableOpacity
            style={newConversationStyles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={newConversationStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={newConversationStyles.headerContent}>
            <Text style={newConversationStyles.headerTitle}>new message</Text>
          </View>
          <View style={newConversationStyles.backButton} />
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
          contentContainerStyle={newConversationStyles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={newConversationStyles.content}
        />

        <ChatInput
          inputText={messageText}
          onChangeText={setMessageText}
          onSend={handleStartChat}
          disabled={selectedContacts.length === 0}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

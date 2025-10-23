import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import ConversationItem, { Conversation } from '@/components/conversations/ConversationItem';

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    displayName: 'Sarah Johnson',
    lastMessage: 'Hey! How are you doing?',
    timestamp: '10:30 AM',
    avatarColor: '#FF6B6B',
    unread: true,
  },
  {
    id: '2',
    displayName: 'Mike Chen',
    lastMessage: 'That sounds great! Let me know when you are free.',
    timestamp: 'Yesterday',
    avatarColor: '#4ECDC4',
  },
  {
    id: '3',
    displayName: 'Emily Davis',
    lastMessage: 'Thanks for the help earlier 🙏',
    timestamp: 'Tuesday',
    avatarColor: '#95E1D3',
  },
  {
    id: '4',
    displayName: 'Alex Rodriguez',
    lastMessage: 'See you tomorrow!',
    timestamp: 'Monday',
    avatarColor: '#F38181',
  },
];

export default function ConversationListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleNewConversation = () => {
    router.push('/new-conversation');
  };

  const handleLogout = () => {
    router.push('/(auth)/');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={[styles.emptyText, { color: colors.icon }]}>
        No conversations yet. Start a new chat!
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.tint }]}
        onPress={handleNewConversation}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Start Chatting</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem conversation={item} onPress={handleConversationPress} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Comm</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.tint }]}
            onPress={handleNewConversation}
            activeOpacity={0.8}
          >
            <Text style={styles.iconButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={conversations.length === 0 ? styles.emptyListContainer : undefined}
        style={{ backgroundColor: colors.background }}
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: colors.tint }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        paddingTop: 12,
      },
      default: {
        paddingTop: 0,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        paddingBottom: 12,
      },
      default: {
        paddingBottom: 0,
      },
    }),
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

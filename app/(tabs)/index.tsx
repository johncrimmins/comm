import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthUser } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { markConversationsDelivered } from '@/services/chat';
import { useNotifications } from '@/hooks/useNotifications';

// Removed mock conversations; using SQLite-driven hook instead

export default function ConversationListScreen() {
  const router = useRouter();
  const previews = useConversations();
  const user = useAuthUser();

  // Mark all conversations as delivered when user opens app (tabs screen)
  useEffect(() => {
    if (user?.uid) {
      markConversationsDelivered(user.uid).catch(() => {});
    }
  }, [user?.uid]);

  // Initialize notifications for conversations OTHER than the current one
  // currentConversationId is null when user is on tabs screen (not in a chat)
  useNotifications(null);

  // Map hook output to UI conversation format
  const conversations = useMemo(() =>
    previews.map((p, idx) => ({
      id: p.id,
      displayName: p.displayName ?? `conversation ${idx + 1}`,
      lastMessage: p.lastMessage ?? '',
      timestamp: p.timestamp ?? '',
      avatarColor: p.avatarColor ?? '#7C3AED',
    })),
  [previews]);

  const handleConversationPress = (conversation: typeof conversations[0]) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleNewConversation = () => {
    router.push('/new-conversation');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✨</Text>
      <Text style={styles.emptyTitle}>reply 3x faster</Text>
      <Text style={styles.emptyText}>
        start your first conversation with ai that understands your tone
      </Text>
    </View>
  );

  const renderConversation = ({ item }: { item: typeof conversations[0] }) => (
    <TouchableOpacity
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.9}
      style={styles.conversationWrapper}
    >
      <GlassCard intensity={20} style={styles.conversationCard}>
        <View style={styles.conversationContent}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.avatarText}>
              {item.displayName.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.displayName} numberOfLines={1}>
                {item.displayName}
              </Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
            <View style={styles.messageRow}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
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
          <View>
            <Text style={styles.headerTitle}>messages</Text>
            <Text style={styles.headerSubtitle}>
              {conversations.length} conversations {user ? `· ${user.email ?? user.uid}` : '· Signed out'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewConversation}
            activeOpacity={0.8}
          >
            <Text style={styles.newChatIcon}>✨</Text>
            <Text style={styles.newChatText}>new</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.dark.glassLight,
    borderWidth: 1,
    borderColor: Colors.dark.accentStart,
    gap: 8,
  },
  newChatIcon: {
    fontSize: 18,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  conversationWrapper: {
    marginBottom: 4,
  },
  conversationCard: {
    overflow: 'hidden',
  },
  conversationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  timestamp: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'lowercase',
  },
});

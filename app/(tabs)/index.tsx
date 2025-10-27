import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import GradientBackground from '@/components/ui/GradientBackground';
import { useAuthUser } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { markConversationsDelivered } from '@/services/chat';
import { useNotifications } from '@/hooks/useNotifications';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/db';
import { tabsStyles } from '@/styles/screens/tabs';
import { SwipeableRow } from '@/components/conversation/SwipeableRow';

// Removed mock conversations; using SQLite-driven hook instead

export default function ConversationListScreen() {
  const router = useRouter();
  const previews = useConversations();
  const user = useAuthUser();
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);

  // Get AI conversation ID
  useEffect(() => {
    if (!user?.uid) return;
    
    const getAIConversation = async () => {
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('participantIds', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        
        const aiConv = snapshot.docs.find(doc => {
          const data = doc.data();
          return data.participantIds.includes('ai-assistant');
        });
        
        if (aiConv) {
          setAiConversationId(aiConv.id);
        }
      } catch (error) {
        // Silent failure
      }
    };
    
    getAIConversation();
  }, [user?.uid]);

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
      unreadCount: p.unreadCount,
    })),
  [previews]);

  const handleConversationPress = (conversation: typeof conversations[0]) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleNewConversation = () => {
    router.push('/new-conversation');
  };

  const handleAIConversationPress = () => {
    if (aiConversationId) {
      router.push(`/chat/${aiConversationId}`);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await deleteDoc(conversationRef);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={tabsStyles.emptyContainer}>
      <Text style={tabsStyles.emptyIcon}>✨</Text>
      <Text style={tabsStyles.emptyTitle}>reply 3x faster</Text>
      <Text style={tabsStyles.emptyText}>
        start your first conversation with ai that understands your tone
      </Text>
    </View>
  );

  const renderConversation = ({ item }: { item: typeof conversations[0] }) => {
    const isAI = item.id === aiConversationId;
    
    // Don't allow deleting AI conversation
    if (isAI) {
      return (
        <TouchableOpacity
          onPress={handleAIConversationPress}
          activeOpacity={0.9}
          style={tabsStyles.conversationWrapper}
        >
          <View style={tabsStyles.conversationCard}>
            <View style={tabsStyles.conversationContent}>
              <View style={[tabsStyles.avatar, { backgroundColor: item.avatarColor }]}>
                <Text style={tabsStyles.avatarText}>
                  {item.displayName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={tabsStyles.conversationInfo}>
                <View style={tabsStyles.conversationHeader}>
                  <Text style={tabsStyles.displayName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <Text style={tabsStyles.timestamp}>{item.timestamp}</Text>
                </View>
                <View style={tabsStyles.messageRow}>
                  <Text style={[
                    tabsStyles.lastMessage,
                    item.unreadCount ? tabsStyles.lastMessageUnread : undefined
                  ]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount && (
                    <View style={tabsStyles.unreadBadge}>
                      <Text style={tabsStyles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    
    return (
      <SwipeableRow onDelete={() => handleDeleteConversation(item.id)}>
        <TouchableOpacity
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.9}
          style={tabsStyles.conversationWrapper}
        >
          <View style={tabsStyles.conversationCard}>
            <View style={tabsStyles.conversationContent}>
              <View style={[tabsStyles.avatar, { backgroundColor: item.avatarColor }]}>
                <Text style={tabsStyles.avatarText}>
                  {item.displayName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={tabsStyles.conversationInfo}>
                <View style={tabsStyles.conversationHeader}>
                  <Text style={tabsStyles.displayName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <Text style={tabsStyles.timestamp}>{item.timestamp}</Text>
                </View>
                <View style={tabsStyles.messageRow}>
                  <Text style={[
                    tabsStyles.lastMessage,
                    item.unreadCount ? tabsStyles.lastMessageUnread : undefined
                  ]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount && (
                    <View style={tabsStyles.unreadBadge}>
                      <Text style={tabsStyles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  const edges: Edge[] = ['top', 'right'];

  // AI conversation item
  const aiConversation = aiConversationId ? {
    id: aiConversationId,
    displayName: 'Chat with Comms (AI)',
    lastMessage: '',
    timestamp: '',
    avatarColor: '#C084FC',
    unreadCount: undefined,
  } : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground>
        <SafeAreaView style={tabsStyles.container} edges={edges}>
          <StatusBar style="light" />
          
          <View style={tabsStyles.header}>
            <Text style={tabsStyles.headerTitle}>Comms</Text>
            <TouchableOpacity
              style={tabsStyles.newChatButton}
              onPress={handleNewConversation}
              activeOpacity={0.7}
            >
              <Text style={tabsStyles.newChatIcon}>✨</Text>
            </TouchableOpacity>
          </View>

          {/* Sticky AI conversation */}
          {aiConversation && (
            <View style={tabsStyles.aiSection}>
              {renderConversation({ item: aiConversation as typeof conversations[0] })}
            </View>
          )}

          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={tabsStyles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </GradientBackground>
    </GestureHandlerRootView>
  );
}

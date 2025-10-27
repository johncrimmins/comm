/**
 * Tabs Screen Styles
 * Extracted from app/(tabs)/index.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const tabsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.secondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatIcon: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    gap: 8,
  },
  aiSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  conversationWrapper: {
    marginBottom: 0, // No spacing between items - seamless look
  },
  conversationCard: {
    backgroundColor: 'transparent', // Remove card background
    borderWidth: 0, // Remove borders
  },
  conversationContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 52, // Larger to match TalkTime proportions
    height: 52, // Larger to match TalkTime proportions
    borderRadius: 26, // Larger to match TalkTime proportions
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align to top
    marginBottom: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600', // Bold for display names
    color: '#FFFFFF', // Pure white for high contrast
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#777777', // Gray for timestamps
    fontFamily: 'Inter_400Regular',
    lineHeight: 13,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center', // Center align message and badge horizontally
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#AAAAAA', // Gray for read messages
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 20,
  },
  lastMessageUnread: {
    color: '#FFFFFF', // High contrast white for unread
  },
  unreadBadge: {
    backgroundColor: Colors.dark.accentStart, // Amber #F5A623
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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


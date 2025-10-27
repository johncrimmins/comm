/**
 * New Conversation Screen Styles
 * Extracted from app/new-conversation.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const newConversationStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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
});


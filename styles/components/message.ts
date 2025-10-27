/**
 * Message Component Styles
 * Extracted from components/chat/Message.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const messageStyles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  currentUserContainer: {
    alignItems: 'flex-end',
  },
  otherUserContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 4,
    marginLeft: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bubbleWrapper: {
    maxWidth: '80%', // Changed from 75%
    borderRadius: 20, // Changed from 16 to match spec
    overflow: 'hidden',
  },
  currentUserBubble: {
    // No border for current user bubbles
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentUserBubbleContent: {
    backgroundColor: Colors.dark.accentStart, // #F5A623 solid amber
  },
  otherUserBubbleContent: {
    backgroundColor: Colors.dark.secondary, // #111111
  },
  messageText: {
    fontSize: 15,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 4,
  },
  currentUserMessageText: {
    color: '#000000', // Black text on amber background
  },
  timestamp: {
    fontSize: 10, // Changed from 11 to match spec
    color: Colors.dark.timestampIncoming, // #666666
    fontFamily: 'Inter_400Regular',
    marginTop: 4, // Added margin-top per spec
  },
  currentUserTimestamp: {
    color: Colors.dark.timestampOutgoing, // #4A3A00 dark amber
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  imageContainer: {
    overflow: 'hidden',
  },
});


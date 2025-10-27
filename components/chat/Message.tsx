import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  senderAvatarColor?: string;
  isCurrentUser: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
};

type MessageProps = {
  message: Message;
};

export default function Message({ message }: MessageProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View
      style={[
        styles.container,
        message.isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
      ]}
    >
      {!message.isCurrentUser && message.senderName && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      <View style={styles.contentRow}>
        {!message.isCurrentUser && message.senderName && (
          <View style={[
            styles.avatar,
            { backgroundColor: message.senderAvatarColor || '#7C3AED' }
          ]}>
            <Text style={styles.avatarText}>{getInitials(message.senderName)}</Text>
          </View>
        )}
        
        <View style={[
          styles.bubbleWrapper,
          message.isCurrentUser && styles.currentUserBubble,
        ]}>
          <View
            style={[
              styles.bubble,
              message.isCurrentUser
                ? styles.currentUserBubbleContent
                : styles.otherUserBubbleContent,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text
              style={[
                styles.timestamp,
                message.isCurrentUser && styles.currentUserTimestamp,
              ]}
            >
              {message.timestamp}
              {message.isCurrentUser && message.status ? ` · ${message.status}` : ''}
            </Text>
          </View>
        </View>

        {message.isCurrentUser && message.senderName && (
          <View style={[
            styles.avatar,
            { backgroundColor: message.senderAvatarColor || '#7C3AED' }
          ]}>
            <Text style={styles.avatarText}>{getInitials(message.senderName)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: '75%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  currentUserBubble: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentUserBubbleContent: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  otherUserBubbleContent: {
    backgroundColor: Colors.dark.secondary,
  },
  messageText: {
    fontSize: 15,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  currentUserTimestamp: {
    color: '#A1A1AA',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  isCurrentUser: boolean;
};

type MessageProps = {
  message: Message;
};

export default function Message({ message }: MessageProps) {
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
      
      <View style={[
        styles.bubbleWrapper,
        message.isCurrentUser && styles.currentUserBubble,
      ]}>
        <BlurView
          intensity={message.isCurrentUser ? 60 : 40}
          style={styles.blur}
          tint="dark"
        >
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
            </Text>
          </View>
        </BlurView>
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
    color: Colors.dark.accentStart,
    marginBottom: 4,
    marginLeft: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  currentUserBubble: {
    borderColor: Colors.dark.accentStart,
    boxShadow: [{ color: Colors.dark.glow, offset: { width: 0, height: 2 }, opacity: 0.3, radius: 8 }],
  },
  blur: {
    overflow: 'hidden',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentUserBubbleContent: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
  },
  otherUserBubbleContent: {
    backgroundColor: Colors.dark.glass,
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.container,
        message.isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
      ]}
    >
      {!message.isCurrentUser && message.senderName && (
        <Text style={[styles.senderName, { color: colors.tint }]}>
          {message.senderName}
        </Text>
      )}
      <View
        style={[
          styles.bubble,
          message.isCurrentUser
            ? { backgroundColor: colors.tint }
            : { backgroundColor: colorScheme === 'dark' ? colors.secondary : '#F0F2F5' },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: message.isCurrentUser ? '#fff' : colors.text },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { color: message.isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.icon },
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
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
    marginBottom: 2,
    marginLeft: 12,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
});

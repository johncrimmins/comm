import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type Conversation = {
  id: string;
  displayName: string;
  lastMessage: string;
  timestamp: string;
  avatarColor: string;
};

type ConversationItemProps = {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
};

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: conversation.avatarColor }]}>
        <Text style={styles.avatarText}>{getInitials(conversation.displayName)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.name,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {conversation.displayName}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: colors.icon },
            ]}
          >
            {conversation.timestamp}
          </Text>
        </View>

        <Text
          style={[
            styles.lastMessage,
            { color: colors.icon },
          ]}
          numberOfLines={1}
        >
          {conversation.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
});

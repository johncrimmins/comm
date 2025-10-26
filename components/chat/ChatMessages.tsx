import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Message, { Message as MessageType } from '@/components/chat/Message';

export interface ChatMessagesProps {
  messages: MessageType[];
  isGroupChat: boolean;
  flatListRef: React.MutableRefObject<FlatList<MessageType> | null>;
}

export function ChatMessages({ messages, isGroupChat, flatListRef }: ChatMessagesProps) {
  const renderMessage = ({ item }: { item: MessageType }) => {
    // Show sender name in group chats for non-current-user messages
    const messageWithName = isGroupChat && !item.isCurrentUser 
      ? { ...item, senderName: item.senderName || 'member' }
      : item;
    
    return <Message message={messageWithName} />;
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.messageList}
      showsVerticalScrollIndicator={false}
      inverted={false}
    />
  );
}

const styles = StyleSheet.create({
  messageList: {
    paddingVertical: 16,
  },
});


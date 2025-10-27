import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
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
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 16,
  },
});


import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { messageStyles } from '@/styles/components/message';

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  senderAvatarColor?: string;
  isCurrentUser: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
  imageUrl?: string;
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
      .slice(0, 1);
  };

  return (
    <View
      style={[
        messageStyles.container,
        message.isCurrentUser ? messageStyles.currentUserContainer : messageStyles.otherUserContainer,
      ]}
    >
      {!message.isCurrentUser && message.senderName && (
        <Text style={messageStyles.senderName}>{message.senderName}</Text>
      )}
      
      <View style={messageStyles.contentRow}>
        {!message.isCurrentUser && message.senderName && (
          <View style={[
            messageStyles.avatar,
            { backgroundColor: message.senderAvatarColor || '#000000' }
          ]}>
            <Text style={messageStyles.avatarText}>{getInitials(message.senderName)}</Text>
          </View>
        )}
        
        <View style={[
          messageStyles.bubbleWrapper,
          message.isCurrentUser && messageStyles.currentUserBubble,
        ]}>
          <View
            style={[
              messageStyles.bubble,
              message.isCurrentUser
                ? messageStyles.currentUserBubbleContent
                : messageStyles.otherUserBubbleContent,
            ]}
          >
            {message.imageUrl && (
              <View style={messageStyles.imageContainer}>
                <Image
                  source={{ uri: message.imageUrl }}
                  style={messageStyles.image}
                  contentFit="cover"
                />
              </View>
            )}
            {message.text && (
              <Text style={[
                messageStyles.messageText,
                message.isCurrentUser && messageStyles.currentUserMessageText
              ]}>
                {message.text}
              </Text>
            )}
            <Text
              style={[
                messageStyles.timestamp,
                message.isCurrentUser && messageStyles.currentUserTimestamp,
              ]}
            >
              {message.timestamp}
              {message.isCurrentUser && message.status ? ` · ${message.status}` : ''}
            </Text>
          </View>
        </View>

        {message.isCurrentUser && message.senderName && (
          <View style={[
            messageStyles.avatar,
            { backgroundColor: message.senderAvatarColor || '#000000' }
          ]}>
            <Text style={messageStyles.avatarText}>{getInitials(message.senderName)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}


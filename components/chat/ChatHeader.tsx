import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { chatHeaderStyles } from '@/styles/components/chatHeader';

export interface ChatHeaderProps {
  onBack: () => void;
  title: string;
  subtitle: string;
  onAIClick?: () => void;
}

export function ChatHeader({ onBack, title, subtitle, onAIClick }: ChatHeaderProps) {
  return (
    <View style={chatHeaderStyles.header}>
      <TouchableOpacity
        style={chatHeaderStyles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Text style={chatHeaderStyles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={chatHeaderStyles.headerContent}>
        <Text style={chatHeaderStyles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={chatHeaderStyles.headerSubtitle}>
          {subtitle}
        </Text>
      </View>
      <TouchableOpacity style={chatHeaderStyles.aiButton} activeOpacity={0.8} onPress={onAIClick}>
        <Text style={chatHeaderStyles.aiButtonText}>✨</Text>
      </TouchableOpacity>
    </View>
  );
}


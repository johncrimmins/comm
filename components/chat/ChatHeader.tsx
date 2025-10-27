import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { chatHeaderStyles } from '@/styles/components/chatHeader';

export interface ChatHeaderProps {
  onBack: () => void;
  title: string;
  subtitle: string;
  onAIClick?: () => void;
  onTitleChange?: (newTitle: string) => void;
  editable?: boolean;
}

export function ChatHeader({ onBack, title, subtitle, onAIClick, onTitleChange, editable = false }: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const handleTitlePress = () => {
    if (editable && !isEditing) {
      setIsEditing(true);
      setEditValue(title);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onTitleChange && editValue.trim() !== title) {
      onTitleChange(editValue.trim());
    }
  };

  const handleSubmit = () => {
    handleBlur();
  };

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
        {isEditing ? (
          <TextInput
            style={chatHeaderStyles.headerTitle}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            autoFocus
            maxLength={50}
          />
        ) : (
          <TouchableOpacity onPress={handleTitlePress} activeOpacity={editable ? 0.7 : 1}>
            <Text style={chatHeaderStyles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </TouchableOpacity>
        )}
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


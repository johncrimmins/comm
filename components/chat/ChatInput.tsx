import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import GlassCard from '@/components/ui/GlassCard';

export interface ChatInputProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ inputText, onChangeText, onSend, disabled = false }: ChatInputProps) {
  console.log('[ChatInput] Component rendered', {
    platform: Platform.OS,
    behavior: Platform.OS === 'ios' ? 'padding' : undefined,
    keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 0,
    disabled,
    inputTextLength: inputText.length,
  });

  const inputContent = (
    <View style={styles.inputContainer}>
      <GlassCard style={styles.inputCard} intensity={30}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="message..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={inputText}
            onChangeText={onChangeText}
            multiline
            maxLength={1000}
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (disabled || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={disabled || !inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  // Only use KeyboardAvoidingView on native platforms
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 0 }}
      >
        {inputContent}
      </KeyboardAvoidingView>
    );
  }

  // Web and other platforms render directly
  return inputContent;
}

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputCard: {
    borderRadius: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    boxShadow: [{ color: Colors.dark.glow, offsetX: 0, offsetY: 2, blurRadius: 8 }],
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark.border,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});


import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import GlassCard from '@/components/ui/GlassCard';
import { makeConcise } from '@/services/openai';

export interface ChatInputProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ inputText, onChangeText, onSend, disabled = false }: ChatInputProps) {
  const [showConciseMenu, setShowConciseMenu] = useState(false);
  const [isProcessingConcise, setIsProcessingConcise] = useState(false);
  const [hasLongPressed, setHasLongPressed] = useState(false);
  
  // Animated values for popover
  const popoverOpacity = useSharedValue(0);
  const popoverScale = useSharedValue(0.8);
  const popoverY = useSharedValue(0);

  // Handle long press
  const handleLongPress = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && inputText.trim()) {
      setHasLongPressed(true); // Mark that long press occurred
      setShowConciseMenu(true);
      // Animate popover in
      popoverOpacity.value = withTiming(1, { duration: 200 });
      popoverScale.value = withSpring(1, { damping: 15 });
      popoverY.value = withSpring(0, { damping: 15 });
    }
  };

  // Dismiss popover when clicking outside
  const handleDismissPopover = () => {
    if (showConciseMenu) {
      popoverOpacity.value = withTiming(0, { duration: 150 });
      popoverScale.value = withTiming(0.8, { duration: 150 });
      setTimeout(() => {
        setShowConciseMenu(false);
        setHasLongPressed(false); // Reset flag when popover closes
      }, 150);
    }
  };

  // Handle concise button press
  const handleConcise = async () => {
    if (!inputText.trim() || isProcessingConcise) return;
    
    setIsProcessingConcise(true);
    setShowConciseMenu(false);
    
    // Animate popover out
    popoverOpacity.value = withTiming(0, { duration: 150 });
    popoverScale.value = withTiming(0.8, { duration: 150 });
    
    try {
      const { conciseText } = await makeConcise({ text: inputText });
      onChangeText(conciseText);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to make message concise. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingConcise(false);
      setHasLongPressed(false); // Reset flag after concise completes
    }
  };

  // Handle send button press - don't send if long press occurred
  const handleSendPress = () => {
    if (hasLongPressed || showConciseMenu) {
      // Long press was triggered, don't send message
      return;
    }
    onSend();
  };

  // Animated style for popover
  const popoverAnimatedStyle = useAnimatedStyle(() => ({
    opacity: popoverOpacity.value,
    transform: [
      { scale: popoverScale.value },
      { translateY: popoverY.value },
    ],
  }));

  const contentWrapper = (
    <View style={styles.wrapper}>
      {/* Overlay to dismiss popover when clicking outside */}
      {showConciseMenu && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleDismissPopover}
        />
      )}

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
            <View style={styles.sendButtonContainer}>
              <LongPressGestureHandler
                onHandlerStateChange={handleLongPress}
                minDurationMs={400}
              >
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (disabled || !inputText.trim()) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendPress}
                  disabled={disabled || !inputText.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </LongPressGestureHandler>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Concise Menu Popover - positioned absolutely within wrapper */}
      {showConciseMenu && inputText.trim() && (
        <Animated.View style={[styles.popoverContainer, popoverAnimatedStyle]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.conciseButton}
            onPress={() => {
              handleConcise();
            }}
            activeOpacity={0.8}
            disabled={isProcessingConcise}
          >
            <Text style={styles.conciseButtonText}>
              {isProcessingConcise ? '...' : 'Concise'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
        {contentWrapper}
      </KeyboardAvoidingView>
    );
  }

  // Web and other platforms render directly
  return contentWrapper;
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 998,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputCard: {
    borderRadius: 24,
    overflow: 'visible',
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
  sendButtonContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
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
  popoverContainer: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  conciseButton: {
    backgroundColor: Colors.dark.accentStart,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.dark.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  conciseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});


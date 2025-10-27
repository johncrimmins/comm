import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import GlassCard from '@/components/ui/GlassCard';
import { transformText } from '@/services/openai';
import { transformations } from '@/services/messageTransformations';
import { chatInputStyles } from '@/styles/components/chatInput';

export interface ChatInputProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ inputText, onChangeText, onSend, disabled = false }: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasLongPressed, setHasLongPressed] = useState(false);
  
  // Animated values for popover
  const popoverOpacity = useSharedValue(0);
  const popoverScale = useSharedValue(0.8);
  const popoverY = useSharedValue(0);

  // Handle long press
  const handleLongPress = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && inputText.trim()) {
      setHasLongPressed(true); // Mark that long press occurred
      setShowMenu(true);
      // Animate popover in
      popoverOpacity.value = withTiming(1, { duration: 200 });
      popoverScale.value = withSpring(1, { damping: 15 });
      popoverY.value = withSpring(0, { damping: 15 });
    }
  };

  // Dismiss popover when clicking outside
  const handleDismissPopover = () => {
    if (showMenu) {
      popoverOpacity.value = withTiming(0, { duration: 150 });
      popoverScale.value = withTiming(0.8, { duration: 150 });
      setTimeout(() => {
        setShowMenu(false);
        setHasLongPressed(false); // Reset flag when popover closes
      }, 150);
    }
  };

  // Handle transformation button press
  const handleTransform = async (transformation: typeof transformations[0]) => {
    if (!inputText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setShowMenu(false);
    
    // Animate popover out
    popoverOpacity.value = withTiming(0, { duration: 150 });
    popoverScale.value = withTiming(0.8, { duration: 150 });
    
    try {
      const transformedText = await transformText({
        text: inputText,
        systemPrompt: transformation.systemPrompt
      });
      onChangeText(transformedText);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || `Failed to ${transformation.label.toLowerCase()} message. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setHasLongPressed(false); // Reset flag after transformation completes
    }
  };

  // Handle send button press - don't send if long press occurred
  const handleSendPress = () => {
    if (hasLongPressed || showMenu) {
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
    <View style={chatInputStyles.wrapper}>
      {/* Overlay to dismiss popover when clicking outside */}
      {showMenu && (
        <TouchableOpacity
          style={chatInputStyles.overlay}
          activeOpacity={1}
          onPress={handleDismissPopover}
        />
      )}

      <View style={chatInputStyles.inputContainer}>
        <GlassCard style={chatInputStyles.inputCard} intensity={30}>
          <View style={chatInputStyles.inputWrapper}>
            <TextInput
              style={chatInputStyles.input}
              placeholder="message..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={inputText}
              onChangeText={onChangeText}
              multiline
              maxLength={1000}
              autoFocus
            />
            <View style={chatInputStyles.sendButtonContainer}>
              <LongPressGestureHandler
                onHandlerStateChange={handleLongPress}
                minDurationMs={400}
              >
                <TouchableOpacity
                  style={[
                    chatInputStyles.sendButton,
                    (disabled || !inputText.trim()) && chatInputStyles.sendButtonDisabled,
                  ]}
                  onPress={handleSendPress}
                  disabled={disabled || !inputText.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={chatInputStyles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </LongPressGestureHandler>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Transformation Menu Popover - positioned absolutely within wrapper */}
      {showMenu && inputText.trim() && (
        <Animated.View style={[chatInputStyles.popoverContainer, popoverAnimatedStyle]} pointerEvents="box-none">
          {transformations.map((transformation, index) => (
            <TouchableOpacity
              key={transformation.id}
              style={[
                chatInputStyles.transformButton,
                index === 0 && chatInputStyles.transformButtonFirst,
                index === transformations.length - 1 && chatInputStyles.transformButtonLast
              ]}
              onPress={() => handleTransform(transformation)}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              <Text style={chatInputStyles.transformButtonText}>
                {isProcessing ? '...' : transformation.label}
              </Text>
            </TouchableOpacity>
          ))}
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


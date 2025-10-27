import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { transformText } from '@/services/openai';
import { transformations } from '@/services/messageTransformations';
import { chatInputStyles } from '@/styles/components/chatInput';

export interface ChatInputProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onImageSelect?: (uri: string) => void;
  selectedImageUri?: string;
  disabled?: boolean;
}

export function ChatInput({ inputText, onChangeText, onSend, onImageSelect, selectedImageUri, disabled = false }: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasLongPressed, setHasLongPressed] = useState(false);
  
  // Handle image picker
  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
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

      {/* Image Preview */}
      {selectedImageUri && (
        <View style={chatInputStyles.imagePreviewContainer}>
          <Image
            source={{ uri: selectedImageUri }}
            style={chatInputStyles.imagePreview}
            contentFit="cover"
          />
          <TouchableOpacity
            style={chatInputStyles.removeImageButton}
            onPress={() => onImageSelect?.(undefined as any)}
            activeOpacity={0.8}
          >
            <Text style={chatInputStyles.removeImageButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={chatInputStyles.inputContainer}>
        {Platform.OS === 'web' ? (
          <View style={[chatInputStyles.inputCard, { backgroundColor: Colors.dark.secondary }]}>
            <View style={chatInputStyles.inputWrapper}>
              <TouchableOpacity
                style={chatInputStyles.attachButton}
                onPress={handleImagePick}
                activeOpacity={0.7}
              >
                <Text style={chatInputStyles.attachButtonText}>📎</Text>
              </TouchableOpacity>
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
                      (disabled || (!inputText.trim() && !selectedImageUri)) && chatInputStyles.sendButtonDisabled,
                    ]}
                    onPress={handleSendPress}
                    disabled={disabled || (!inputText.trim() && !selectedImageUri)}
                    activeOpacity={0.8}
                  >
                    <Text style={chatInputStyles.sendButtonText}>→</Text>
                  </TouchableOpacity>
                </LongPressGestureHandler>
              </View>
            </View>
          </View>
        ) : (
          <BlurView intensity={80} tint="dark" style={chatInputStyles.inputCard}>
            <View style={chatInputStyles.inputWrapper}>
              <TouchableOpacity
                style={chatInputStyles.attachButton}
                onPress={handleImagePick}
                activeOpacity={0.7}
              >
                <Text style={chatInputStyles.attachButtonText}>📎</Text>
              </TouchableOpacity>
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
                      (disabled || (!inputText.trim() && !selectedImageUri)) && chatInputStyles.sendButtonDisabled,
                    ]}
                    onPress={handleSendPress}
                    disabled={disabled || (!inputText.trim() && !selectedImageUri)}
                    activeOpacity={0.8}
                  >
                    <Text style={chatInputStyles.sendButtonText}>→</Text>
                  </TouchableOpacity>
                </LongPressGestureHandler>
              </View>
            </View>
          </BlurView>
        )}
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


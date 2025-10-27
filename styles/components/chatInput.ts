/**
 * ChatInput Component Styles
 * Extracted from components/chat/ChatInput.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const chatInputStyles = StyleSheet.create({
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
    borderRadius: 24, // Changed from 16 to match spec
    overflow: 'visible',
    // Floating effect shadows
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)', // Modern shadow syntax
    elevation: 10,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3F3F46',
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
    gap: 8,
  },
  transformButton: {
    backgroundColor: Colors.dark.accentStart,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 0,
    boxShadow: '0px 4px 8px rgba(245, 166, 35, 0.6)', // Modern shadow syntax (amber glow)
    elevation: 8,
  },
  transformButtonFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  transformButtonLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  transformButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});


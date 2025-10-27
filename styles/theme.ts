/**
 * Centralized Theme Configuration
 * Contains design tokens, typography, spacing, and other shared values
 */

import { Colors } from '@/constants/Colors';

export const theme = {
  colors: Colors.dark,
  
  typography: {
    heading1: {
      fontSize: 32,
      fontWeight: '800' as const,
      fontFamily: 'Inter_800ExtraBold',
      letterSpacing: -1,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: 'Inter_700Bold',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
    },
    small: {
      fontSize: 13,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
    },
    semibold: {
      fontSize: 15,
      fontWeight: '600' as const,
      fontFamily: 'Inter_600SemiBold',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    message: 20, // Message bubbles
    input: 24, // Input bars
    navBar: 32, // Navigation bar
    full: 9999,
  },
  
  elevation: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  
  avatar: {
    small: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    medium: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    large: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
  },
};


/**
 * Navigation Bar Styles
 * Extracted from app/(tabs)/_layout.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const navBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0A0A', // Dark background
    borderTopWidth: 0,
    height: 72,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 36, // Increased for more pill-like appearance
    elevation: 12, // Increased for more pronounced floating effect
    boxShadow: '0px -8px 16px rgba(0, 0, 0, 0.4)', // Modern shadow syntax
    // Remove absolute positioning - Expo Router handles this
  },
  tabBarItem: {
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  tabBarIcon: {
    marginTop: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
});


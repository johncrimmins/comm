/**
 * Navigation Bar Styles
 * Extracted from app/(tabs)/_layout.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const navBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0A0A', // Changed from #1F1F1F
    borderTopWidth: 0,
    height: 72,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 32, // Changed from borderTopLeftRadius and borderTopRightRadius
    elevation: 8, // Changed from 0
    shadowOpacity: 0.25, // Changed from 0
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    shadowColor: '#000',
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


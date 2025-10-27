/**
 * Auth Screen Styles
 * Extracted from app/(auth)/index.tsx
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 12,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  formCard: {
    marginTop: 8,
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  toggleTextAccent: {
    color: Colors.dark.accentStart,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});


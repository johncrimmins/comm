import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface FormLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export default function FormLabel({ children, style }: FormLabelProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface ErrorTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export default function ErrorText({ children, style }: ErrorTextProps) {
  if (!children) return null;
  return <Text style={[styles.errorText, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
});

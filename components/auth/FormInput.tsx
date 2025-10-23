import React from 'react';
import { TextInput, StyleSheet, TextInputProps, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface FormInputProps extends TextInputProps {
  hasError?: boolean;
  inputStyle?: TextStyle;
}

export default function FormInput({ hasError, inputStyle, ...props }: FormInputProps) {
  return (
    <TextInput
      style={[styles.input, hasError && styles.inputError, inputStyle]}
      placeholderTextColor={Colors.dark.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
  },
  inputError: {
    borderColor: '#EF4444',
  },
});

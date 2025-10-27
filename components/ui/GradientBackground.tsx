import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type GradientBackgroundProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.background]}
      style={[styles.gradient, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

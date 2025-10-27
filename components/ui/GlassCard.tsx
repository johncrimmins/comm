import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type GlassCardProps = {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
};

export default function GlassCard({ children, intensity = 0, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark.secondary,
  },
});

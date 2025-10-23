import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';

type GlassCardProps = {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
};

export default function GlassCard({ children, intensity = 30, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} style={styles.blur} tint="dark">
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark.glass,
  },
});

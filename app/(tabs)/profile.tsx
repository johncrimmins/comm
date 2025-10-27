import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '@/components/ui/GradientBackground';
import { useAuthUser } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const user = useAuthUser();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email || 'Not signed in'}</Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.accentStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  email: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
});


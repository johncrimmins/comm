import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { navBarStyles } from '@/styles/components/navBar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          navBarStyles.tabBar,
          {
            marginHorizontal: 16,
            marginBottom: Platform.OS === 'web' ? 8 : insets.bottom + 8,
            width: 'auto', // Prevent overflow
          }
        ],
        tabBarItemStyle: navBarStyles.tabBarItem,
        tabBarActiveTintColor: Colors.dark.accentStart, // Changed to amber
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarLabelStyle: navBarStyles.tabBarLabel,
        tabBarIconStyle: navBarStyles.tabBarIcon,
        tabBarBackground: Platform.OS === 'web' 
          ? () => <View style={{ flex: 1, backgroundColor: '#0A0A0A', borderRadius: 32 }} />
          : () => <BlurView intensity={95} tint="dark" style={{ flex: 1, borderRadius: 32 }} />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} icon="💬" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} icon="👤" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={[navBarStyles.iconContainer, { backgroundColor: color === Colors.dark.accentStart ? '#1A1A1A' : 'transparent' }]}>
      <Text style={navBarStyles.icon}>{icon}</Text>
    </View>
  );
}

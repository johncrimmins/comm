import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthUser } from '@/hooks/useAuth';
import { initializeNetworkMonitoring } from '@/lib/network';
import { initializeSync } from '@/lib/sync';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Initialize offline persistence
  useEffect(() => {
    // Initialize network monitoring
    const unsubscribeNetwork = initializeNetworkMonitoring();
    
    // Initialize sync when user is logged in
    if (user?.uid) {
      initializeSync(user.uid).catch(console.error);
    }
    
    return () => {
      unsubscribeNetwork();
    };
  }, [user?.uid]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        {!user && <Stack.Screen name="(auth)" options={{ headerShown: false }} />}
        {user && (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="new-conversation" options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';
import { getDatabase } from '@/db/database';
import { getUserStats } from '@/db/xp';
import { useAppStore } from '@/store/useAppStore';
import { syncWidgetData } from '@/utils/widgetSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useThemeStore } from '@/constants/theme';
import type { ThemeMode } from '@/constants/theme';

function handleDeepLink(url: string) {
  // Parse zenflo://task/{id}, zenflo://habit/{id}, zenflo://home
  const parsed = Linking.parse(url);
  const path = parsed.path ?? '';

  if (path.startsWith('task/') || path.startsWith('habit/')) {
    // Navigate to dashboard — tasks & habits are shown inline
    router.replace('/(home)');
  } else {
    router.replace('/(home)');
  }
}

export default function RootLayout() {
  const Colors = useColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [ready, setReady] = useState(false);
  const setStats = useAppStore((s) => s.setStats);

  useEffect(() => {
    (async () => {
      // Restore saved theme preference
      const savedTheme = await AsyncStorage.getItem('zenflo_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme as ThemeMode);
      }

      await getDatabase();
      setStats(await getUserStats());
      setReady(true);

      // Sync widget data on app launch (iOS)
      if (Platform.OS === 'ios') {
        syncWidgetData();
      }
    })();
  }, []);

  // Handle deep links from widget taps
  useEffect(() => {
    if (!ready) return;

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle cold-start deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.background.primary }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modals" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDatabase } from '@/db/database';
import { getUserStats } from '@/db/xp';
import { useAppStore } from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setStats = useAppStore((s) => s.setStats);

  useEffect(() => {
    (async () => {
      await getDatabase();
      setStats(await getUserStats());
      setReady(true);
    })();
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.background.primary }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
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

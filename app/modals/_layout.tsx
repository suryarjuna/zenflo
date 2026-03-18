import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="add" />
      <Stack.Screen name="add-goal" />
      <Stack.Screen name="add-habit" />
      <Stack.Screen name="add-task" />
      <Stack.Screen name="focus-session" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="flight-log" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="add-event" />
      <Stack.Screen name="calendar" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

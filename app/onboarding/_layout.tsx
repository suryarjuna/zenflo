import { Stack } from 'expo-router';
import { useColors } from '@/constants/theme';

export default function OnboardingLayout() {
  const Colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="habits" />
      <Stack.Screen name="xp-weights" />
      <Stack.Screen name="first-session" />
    </Stack>
  );
}

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const stats = useAppStore((s) => s.stats);
  useEffect(() => {
    if (!stats) return;
    router.replace(stats.onboardingComplete ? '/(home)' : '/onboarding/welcome');
  }, [stats]);
  return null;
}

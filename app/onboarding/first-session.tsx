import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressDots } from './welcome';
import { createGoal } from '@/db/goals';
import { createHabit } from '@/db/habits';
import { startSession, completeSession } from '@/db/sessions';
import { setOnboardingComplete, getUserStats, setUserName } from '@/db/xp';
import { useAppStore } from '@/store/useAppStore';
import { useNotifications } from '@/hooks/useNotifications';
import type { XPWeight, HabitFrequency, Importance } from '@/types';

const SESSION_DURATION = 5 * 60;

async function saveOnboardingData(setStats: (s: ReturnType<typeof getUserStats> extends Promise<infer T> ? T : never) => void) {
  const goalData = await AsyncStorage.getItem('zenflo_onboarding_goal');
  const habitsData = await AsyncStorage.getItem('zenflo_onboarding_habits');
  const nameData = await AsyncStorage.getItem('zenflo_onboarding_name');

  // Save name
  if (nameData) {
    await setUserName(nameData);
  }

  // Save goal
  let goalId: string | undefined;
  if (goalData) {
    const parsed = JSON.parse(goalData);
    const goal = await createGoal({
      title: parsed.title,
      targetDate: parsed.targetDate,
      importance: parsed.importance as Importance | undefined,
    });
    goalId = goal.id;
  }

  // Save habits
  if (habitsData) {
    const habits: { title: string; frequency: HabitFrequency; xpWeight: XPWeight }[] = JSON.parse(habitsData);
    for (const h of habits) {
      await createHabit({
        title: h.title,
        goalId,
        frequency: h.frequency,
        xpWeight: h.xpWeight,
      });
    }
  }

  await setOnboardingComplete();

  // Cleanup
  await AsyncStorage.multiRemove([
    'zenflo_onboarding_goal',
    'zenflo_onboarding_habits',
    'zenflo_onboarding_name',
  ]);

  // Update stats
  const stats = await getUserStats();
  setStats(stats);
}

export default function FirstSessionScreen() {
  const [state, setState] = useState<'ready' | 'running' | 'completed'>('ready');
  const [secondsLeft, setSecondsLeft] = useState(SESSION_DURATION);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const startTimestamp = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setStats = useAppStore((s) => s.setStats);
  const { requestPermissions, scheduleAll } = useNotifications();

  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);
  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  const progress = 1 - secondsLeft / SESSION_DURATION;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Skip the focus session entirely — save data, no XP
  const handleSkip = async () => {
    await saveOnboardingData(setStats);
    await requestPermissions();
    await scheduleAll();
    router.replace('/(home)');
  };

  // End session early — award XP if >= 5 min elapsed
  const handleEndEarly = async () => {
    clearTimer();
    deactivateKeepAwake();

    const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000);
    const actualMinutes = Math.floor(elapsed / 60);

    if (sessionId) {
      const result = await completeSession(sessionId, actualMinutes, true);
      setXpEarned(result.xpEarned);
    }

    await saveOnboardingData(setStats);
    await requestPermissions();
    await scheduleAll();

    setState('completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (xpEarned > 0) {
      xpOpacity.value = withTiming(1, { duration: 300 });
      xpTranslateY.value = withTiming(-30, { duration: 600 });
      xpOpacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
    }
  };

  const startTimer = useCallback(async () => {
    setState('running');
    startTimestamp.current = Date.now();
    await activateKeepAwakeAsync();

    const session = await startSession({ durationMinutes: 5 });
    setSessionId(session.id);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000);
      const remaining = Math.max(SESSION_DURATION - elapsed, 0);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearTimer();
        handleTimerComplete(session.id);
      }
    }, 100);
  }, []);

  const handleTimerComplete = async (sid: string) => {
    setState('completed');
    deactivateKeepAwake();
    clearTimer();

    const result = await completeSession(sid, 5);
    setXpEarned(result.xpEarned);

    await saveOnboardingData(setStats);
    await requestPermissions();
    await scheduleAll();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    xpOpacity.value = withTiming(1, { duration: 300 });
    xpTranslateY.value = withTiming(-30, { duration: 600 });
    xpOpacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
  };

  useEffect(() => {
    return () => {
      clearTimer();
      deactivateKeepAwake();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressDots current={4} total={5} />
      <View style={styles.container}>
        {state === 'ready' && (
          <>
            <View style={styles.center}>
              <Text style={styles.heading}>Welcome to Zenflo.</Text>
              <Text style={styles.subtitle}>Start with 5 minutes of focus.</Text>
              <View style={styles.timerPreview}>
                <ProgressRing size={200} progress={0} color={Colors.monk.primary}>
                  <Text style={styles.timerText}>5:00</Text>
                </ProgressRing>
              </View>
            </View>
            <View style={styles.buttonStack}>
              <Button label="Begin" onPress={startTimer} />
              <Button variant="ghost" label="Skip for now" onPress={handleSkip} />
            </View>
          </>
        )}

        {state === 'running' && (
          <>
            <View style={styles.center}>
              <ProgressRing size={260} progress={progress} color={Colors.monk.primary}>
                <Text style={styles.timerTextLarge}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </Text>
              </ProgressRing>
              <Text style={styles.focusLabel}>Stay focused</Text>
            </View>
            <Button variant="ghost" label="End early" onPress={handleEndEarly} />
          </>
        )}

        {state === 'completed' && (
          <View style={styles.center}>
            <Text style={styles.completedHeading}>Session complete!</Text>
            {xpEarned > 0 && (
              <Animated.Text style={[styles.xpFloat, xpStyle]}>+{xpEarned} XP</Animated.Text>
            )}
            <Text style={styles.completedSubtitle}>
              Your goal and habits are saved. Let's go.
            </Text>
            <Button
              label="Enter Zenflo"
              onPress={() => router.replace('/(home)')}
              style={{ marginTop: Spacing['2xl'] }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.monk.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.text.secondary,
  },
  timerPreview: {
    marginTop: Spacing['2xl'],
  },
  timerText: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.monk.primary,
  },
  timerTextLarge: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  focusLabel: {
    fontSize: Typography.md,
    color: Colors.text.secondary,
  },
  buttonStack: {
    gap: Spacing.md,
  },
  completedHeading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.success,
  },
  xpFloat: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.xp,
  },
  completedSubtitle: {
    fontSize: Typography.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

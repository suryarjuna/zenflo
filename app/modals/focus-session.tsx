import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { startSession, completeSession } from '@/db/sessions';
import { getUserStats } from '@/db/xp';
import { useAppStore } from '@/store/useAppStore';

const DURATION_PRESETS = [
  { label: '20', minutes: 20 },
  { label: '30', minutes: 30 },
  { label: '60', minutes: 60 },
];

export default function FocusSessionModal() {
  const Colors = useColors();
  const { taskId, taskTitle } = useLocalSearchParams<{ taskId?: string; taskTitle?: string }>();
  const [state, setState] = useState<'pre' | 'running' | 'paused' | 'completed'>('pre');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const startTimestamp = useRef(0);
  const pausedElapsed = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHapticMinute = useRef(0);
  const setStats = useAppStore((s) => s.setStats);
  const addXPGain = useAppStore((s) => s.addXPGain);
  const setLevelUp = useAppStore((s) => s.setLevelUp);

  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);
  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  const totalSeconds = selectedDuration * 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const selectPreset = (mins: number) => {
    setSelectedDuration(mins);
    setShowCustom(false);
    setCustomInput('');
  };

  const confirmCustom = () => {
    const mins = parseInt(customInput, 10);
    if (mins > 0 && mins <= 480) {
      setSelectedDuration(mins);
    }
  };

  const startTimer = useCallback(async () => {
    const duration = selectedDuration;
    const totalSec = duration * 60;
    setSecondsLeft(totalSec);
    setState('running');
    startTimestamp.current = Date.now();
    pausedElapsed.current = 0;
    lastHapticMinute.current = 0;
    await activateKeepAwakeAsync();

    const session = await startSession({ durationMinutes: duration, taskId });
    setSessionId(session.id);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000) + pausedElapsed.current;
      const remaining = Math.max(totalSec - elapsed, 0);
      setSecondsLeft(remaining);

      const elapsedMinutes = Math.floor(elapsed / 60);
      if (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && elapsedMinutes !== lastHapticMinute.current) {
        lastHapticMinute.current = elapsedMinutes;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (remaining <= 0) {
        clearTimer();
        finishSession(session.id, duration);
      }
    }, 100);
  }, [selectedDuration, taskId]);

  const pauseTimer = () => {
    clearTimer();
    const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000);
    pausedElapsed.current += elapsed;
    setState('paused');
  };

  const resumeTimer = () => {
    setState('running');
    startTimestamp.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimestamp.current) / 1000) + pausedElapsed.current;
      const remaining = Math.max(totalSeconds - elapsed, 0);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearTimer();
        if (sessionId) finishSession(sessionId, selectedDuration);
      }
    }, 100);
  };

  const finishSession = async (sid: string, nominalDuration: number) => {
    setState('completed');
    deactivateKeepAwake();
    clearTimer();

    const actualMinutes = Math.max(Math.round((totalSeconds - secondsLeft) / 60), nominalDuration);
    const result = await completeSession(sid, actualMinutes);

    if (result.xpEarned > 0) {
      addXPGain(result.xpEarned);
      xpOpacity.value = withTiming(1, { duration: 300 });
      xpTranslateY.value = withTiming(-30, { duration: 600 });
      xpOpacity.value = withDelay(1500, withTiming(0, { duration: 500 }));
    }

    const stats = await getUserStats();
    if (stats.level > (useAppStore.getState().stats?.level ?? 1)) {
      setLevelUp(stats.level);
    }
    setStats(stats);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const endEarly = async () => {
    if (!sessionId) return;
    const elapsed = Math.floor(pausedElapsed.current + (Date.now() - startTimestamp.current) / 1000);
    const actualMinutes = Math.floor(elapsed / 60);
    await finishSession(sessionId, actualMinutes);
  };

  const abandon = () => {
    clearTimer();
    deactivateKeepAwake();
    router.back();
  };

  useEffect(() => {
    return () => {
      clearTimer();
      deactivateKeepAwake();
    };
  }, []);

  const isCustomSelected = !DURATION_PRESETS.some(p => p.minutes === selectedDuration) || showCustom;

  const styles = createStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Pre-start */}
        {state === 'pre' && (
          <>
            <View style={styles.preTop}>
              <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close" accessibilityRole="button">
                <Ionicons name="close" size={28} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.center}>
              <Text style={styles.heading}>Focus Session</Text>
              {taskTitle && <Text style={styles.taskLabel}>{taskTitle}</Text>}

              <View style={styles.durationRow}>
                {DURATION_PRESETS.map(d => (
                  <TouchableOpacity
                    key={d.minutes}
                    style={[styles.durationPill, selectedDuration === d.minutes && !showCustom && styles.durationPillActive]}
                    onPress={() => selectPreset(d.minutes)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${d.minutes} minutes`}
                    accessibilityState={{ selected: selectedDuration === d.minutes && !showCustom }}
                  >
                    <Text style={[styles.durationText, selectedDuration === d.minutes && !showCustom && styles.durationTextActive]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.durationUnit, selectedDuration === d.minutes && !showCustom && styles.durationTextActive]}>
                      min
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.durationPill, isCustomSelected && styles.durationPillActive]}
                  onPress={() => setShowCustom(true)}
                  accessibilityRole="radio"
                  accessibilityLabel="Custom duration"
                  accessibilityState={{ selected: isCustomSelected }}
                >
                  <Ionicons
                    name="timer-outline"
                    size={18}
                    color={isCustomSelected ? Colors.text.inverse : Colors.text.secondary}
                  />
                  <Text style={[styles.durationUnit, isCustomSelected && styles.durationTextActive]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {showCustom && (
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.customInput}
                    value={customInput}
                    onChangeText={setCustomInput}
                    keyboardType="number-pad"
                    placeholder="Minutes"
                    placeholderTextColor={Colors.text.tertiary}
                    maxLength={3}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={confirmCustom}
                    accessibilityLabel="Custom minutes"
                  />
                  <TouchableOpacity
                    style={[styles.customConfirm, !customInput && { opacity: 0.4 }]}
                    onPress={confirmCustom}
                    disabled={!customInput}
                    accessibilityLabel="Confirm custom duration"
                  >
                    <Text style={styles.customConfirmText}>Set</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.selectedLabel}>{selectedDuration} min session</Text>
            </View>
            <Button label="Begin session" onPress={startTimer} />
          </>
        )}

        {/* Running */}
        {state === 'running' && (
          <>
            {taskTitle && <Text style={styles.runningTask}>{taskTitle}</Text>}
            <View style={styles.center}>
              <ProgressRing size={280} progress={progress} color={Colors.monk.primary} strokeWidth={10}>
                <Text style={styles.timerLarge}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </Text>
              </ProgressRing>
            </View>
            <View style={styles.controls}>
              <TouchableOpacity onPress={pauseTimer} style={styles.controlBtn} accessibilityLabel="Pause" accessibilityRole="button">
                <Ionicons name="pause" size={32} color={Colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={abandon} style={styles.controlBtnDanger} accessibilityLabel="Abandon session" accessibilityRole="button">
                <Ionicons name="close" size={28} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Paused */}
        {state === 'paused' && (
          <>
            <View style={styles.center}>
              <ProgressRing size={280} progress={progress} color={Colors.text.tertiary} strokeWidth={10}>
                <Text style={[styles.timerLarge, { opacity: 0.5 }]}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </Text>
              </ProgressRing>
              <Text style={styles.pausedLabel}>Paused</Text>
            </View>
            <View style={styles.pausedControls}>
              <Button label="Resume" onPress={resumeTimer} />
              <Button variant="ghost" label="End session early" onPress={endEarly} />
            </View>
          </>
        )}

        {/* Completed */}
        {state === 'completed' && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            <Text style={styles.completedHeading}>Session complete!</Text>
            <Animated.Text style={[styles.xpFloat, xpStyle]}>+15 XP</Animated.Text>
            <Button
              label="Done"
              onPress={() => router.back()}
              style={{ marginTop: Spacing['2xl'] }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.monk.background },
  container: { flex: 1, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  preTop: { alignItems: 'flex-end' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg },
  heading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text.primary },
  taskLabel: { fontSize: Typography.md, color: Colors.text.secondary },
  durationRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, flexWrap: 'wrap', justifyContent: 'center' },
  durationPill: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.full, backgroundColor: Colors.background.tertiary,
    alignItems: 'center', flexDirection: 'row', gap: Spacing.xs,
  },
  durationPillActive: { backgroundColor: Colors.monk.primary },
  durationText: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text.secondary },
  durationUnit: { fontSize: Typography.xs, color: Colors.text.tertiary },
  durationTextActive: { color: Colors.text.inverse },
  selectedLabel: {
    fontSize: Typography.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customInput: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    minWidth: 100,
  },
  customConfirm: {
    backgroundColor: Colors.monk.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  customConfirmText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text.inverse,
  },
  timerLarge: { fontSize: 56, fontWeight: Typography.bold, color: Colors.text.primary },
  runningTask: { fontSize: Typography.sm, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.lg },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: Spacing['2xl'] },
  controlBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnDanger: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.danger + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  pausedLabel: { fontSize: Typography.lg, color: Colors.text.tertiary },
  pausedControls: { gap: Spacing.md },
  completedHeading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.success },
  xpFloat: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.xp },
});

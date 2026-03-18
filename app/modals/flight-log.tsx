import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { useFlightLog } from '@/hooks/useFlightLog';
import { useAppStore } from '@/store/useAppStore';

type FlightLogData = Awaited<ReturnType<ReturnType<typeof useFlightLog>['getData']>>;

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, i === current && dotStyles.active]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', paddingVertical: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.background.tertiary },
  active: { backgroundColor: Colors.pilot.primary, width: 24 },
});

export default function FlightLogModal() {
  const [screen, setScreen] = useState(0);
  const [data, setData] = useState<FlightLogData | null>(null);
  const [bestMoment, setBestMoment] = useState('');
  const [courseCorrection, setCourseCorrection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { getData, submit } = useFlightLog();
  const stats = useAppStore((s) => s.stats);

  const xpOpacity = useSharedValue(0);
  const xpTranslateY = useSharedValue(0);
  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ translateY: xpTranslateY.value }],
  }));

  // Animated score counter
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    getData().then(setData);
  }, []);

  useEffect(() => {
    if (screen === 0 && data) {
      let current = 0;
      const target = data.habitScore;
      const step = Math.max(1, Math.floor(target / 30));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setDisplayScore(current);
      }, 50);
      return () => clearInterval(timer);
    }
  }, [screen, data]);

  const next = () => {
    if (screen < 6) setScreen(screen + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submit({ bestMoment: bestMoment.trim(), courseCorrection: courseCorrection.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      xpOpacity.value = withTiming(1, { duration: 300 });
      xpTranslateY.value = withTiming(-30, { duration: 600 });
      xpOpacity.value = withDelay(2000, withTiming(0, { duration: 500 }));
    } catch {
      // already submitted
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading flight data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreColor = data.habitScore < 40 ? Colors.danger : data.habitScore < 70 ? Colors.warning : Colors.success;

  const screens = [
    // Screen 1: Altitude check
    <View key="altitude" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Altitude Check</Text>
      <Text style={[styles.bigScore, { color: scoreColor }]}>{displayScore}%</Text>
      <Text style={styles.scoreLabel}>Habit completion this week</Text>
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Tasks completed</Text>
          <Text style={styles.breakdownValue}>{data.tasksCompleted}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>XP earned</Text>
          <Text style={styles.breakdownValue}>{data.xpEarned}</Text>
        </View>
      </View>
    </View>,

    // Screen 2: Flight path
    <View key="path" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Flight Path</Text>
      <Text style={styles.screenSubtitle}>Your active goals and this week's contribution</Text>
      <Text style={styles.placeholderText}>Goal progress tracking active</Text>
    </View>,

    // Screen 3: Turbulence
    <View key="turbulence" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Turbulence</Text>
      {data.missedHabits.length === 0 ? (
        <Text style={styles.cleanFlight}>Clean flight. Zero turbulence.</Text>
      ) : (
        <View style={styles.missedList}>
          {data.missedHabits.map(h => (
            <Card key={h.id}>
              <Text style={styles.missedTitle}>{h.title}</Text>
              <Text style={styles.missedDetail}>{h.daysMissed} day{h.daysMissed !== 1 ? 's' : ''} missed</Text>
            </Card>
          ))}
          <Text style={styles.turbulenceHint}>Opportunity zones for next week.</Text>
        </View>
      )}
    </View>,

    // Screen 4: Best moment
    <View key="best" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Best Moment</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Even small wins count."
        placeholderTextColor={Colors.text.tertiary}
        value={bestMoment}
        onChangeText={setBestMoment}
        multiline
        accessibilityLabel="Best moment this week"
      />
    </View>,

    // Screen 5: Streak report
    <View key="streaks" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Streak Report</Text>
      <View style={styles.overallStreak}>
        <StreakFlame count={stats?.overallStreak ?? 0} size="lg" />
        <Text style={styles.overallStreakLabel}>Overall Zenflo streak</Text>
      </View>
      <View style={styles.streakList}>
        {data.activeStreaks.map(s => (
          <View key={s.id} style={styles.streakRow}>
            <Text style={styles.streakHabit} numberOfLines={1}>{s.title}</Text>
            <StreakFlame count={s.streak} size="sm" />
            {s.freezeTokens > 0 && (
              <Text style={styles.freezeCount}>{s.freezeTokens} freeze{s.freezeTokens !== 1 ? 's' : ''}</Text>
            )}
          </View>
        ))}
      </View>
    </View>,

    // Screen 6: Course correction
    <View key="correction" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Course Correction</Text>
      <TextInput
        style={styles.textArea}
        placeholder="What will you do differently?"
        placeholderTextColor={Colors.text.tertiary}
        value={courseCorrection}
        onChangeText={setCourseCorrection}
        multiline
        accessibilityLabel="Course correction for next week"
      />
    </View>,

    // Screen 7: Clearance granted
    <View key="clearance" style={styles.screenContent}>
      <Ionicons name="airplane" size={48} color={Colors.pilot.primary} />
      <Text style={styles.clearanceTitle}>Clearance granted.</Text>
      <Text style={styles.clearanceSubtitle}>Your flight log is sealed.</Text>
      <Animated.Text style={[styles.xpFloat, xpStyle]}>+30 XP</Animated.Text>
    </View>,
  ];

  const canProceed = () => {
    if (screen === 3) return bestMoment.trim().length >= 3;
    if (screen === 5) return courseCorrection.trim().length >= 1;
    return true;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={28} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ProgressDots current={screen} total={7} />

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {screens[screen]}
        </ScrollView>

        <View style={styles.bottomBar}>
          {screen < 6 ? (
            <Button
              label="Continue"
              onPress={next}
              disabled={!canProceed()}
            />
          ) : (
            <Button
              label="Begin next week"
              onPress={async () => {
                await handleSubmit();
                router.back();
              }}
              loading={submitting}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pilot.background },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.lg },
  scrollArea: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  bottomBar: { padding: Spacing.xl },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.md, color: Colors.text.secondary },
  screenContent: { flex: 1, alignItems: 'center', gap: Spacing.xl },
  screenTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text.primary },
  screenSubtitle: { fontSize: Typography.md, color: Colors.text.secondary, textAlign: 'center' },
  bigScore: { fontSize: 72, fontWeight: Typography.black },
  scoreLabel: { fontSize: Typography.md, color: Colors.text.secondary },
  breakdown: { width: '100%', gap: Spacing.md, marginTop: Spacing.lg },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },
  breakdownLabel: { fontSize: Typography.base, color: Colors.text.secondary },
  breakdownValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text.primary },
  cleanFlight: { fontSize: Typography.lg, color: Colors.success, marginTop: Spacing.xl },
  missedList: { width: '100%', gap: Spacing.md },
  missedTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text.primary },
  missedDetail: { fontSize: Typography.sm, color: Colors.text.secondary, marginTop: Spacing.xs },
  turbulenceHint: { fontSize: Typography.sm, color: Colors.text.tertiary, textAlign: 'center' },
  textArea: {
    width: '100%', minHeight: 120, fontSize: Typography.lg,
    color: Colors.text.primary, backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg, padding: Spacing.lg,
    textAlignVertical: 'top',
  },
  overallStreak: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  overallStreakLabel: { fontSize: Typography.md, color: Colors.text.secondary },
  streakList: { width: '100%', gap: Spacing.md },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakHabit: { flex: 1, fontSize: Typography.base, color: Colors.text.primary },
  freezeCount: { fontSize: Typography.xs, color: Colors.streakFrozen },
  placeholderText: { fontSize: Typography.md, color: Colors.text.tertiary },
  clearanceTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.pilot.primary },
  clearanceSubtitle: { fontSize: Typography.md, color: Colors.text.secondary },
  xpFloat: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.xp },
});

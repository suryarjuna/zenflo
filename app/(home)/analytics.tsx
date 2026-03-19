import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useXP } from '@/hooks/useXP';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useStreaks } from '@/hooks/useStreaks';
import { getDatabase } from '@/db/database';
import { getXPEvents } from '@/db/xp';
import { getSessionCount, getTotalFocusMinutes } from '@/db/sessions';
import { getAllFlightLogs } from '@/db/flight-logs';
import { getAllCategories } from '@/db/categories';
import { getLevelTier, xpForLevel } from '@/constants/levels';
import type { XPEvent, Category } from '@/types';

interface WeeklyXP {
  label: string;
  amount: number;
}

interface HabitStat {
  title: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export default function AnalyticsScreen() {
  const Colors = useColors();
  const stats = useAppStore((s) => s.stats);
  const { totalXP, level, progress } = useXP();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { overallStreak, longestHabitStreak } = useStreaks();

  const [weeklyXP, setWeeklyXP] = useState<WeeklyXP[]>([]);
  const [xpBySource, setXpBySource] = useState<Record<string, number>>({});
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [totalGoalsCompleted, setTotalGoalsCompleted] = useState(0);
  const [flightLogCount, setFlightLogCount] = useState(0);
  const [habitStats, setHabitStats] = useState<HabitStat[]>([]);
  const [avgDailyXP, setAvgDailyXP] = useState(0);
  const [categoryTime, setCategoryTime] = useState<{ name: string; color: string; minutes: number }[]>([]);

  const tier = getLevelTier(level);
  const nextLevel = level + 1;
  const xpToNext = xpForLevel(nextLevel) - totalXP;

  const loadAnalytics = useCallback(async () => {
    const db = await getDatabase();

    // Weekly XP for last 4 weeks
    const weeks: WeeklyXP[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM xp_events
         WHERE date(created_at) >= ? AND date(created_at) < ?`,
        [startStr, endStr]
      );
      const label = i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i}w ago`;
      weeks.push({ label, amount: row?.total ?? 0 });
    }
    setWeeklyXP(weeks);

    // XP by source
    const sourceRows = await db.getAllAsync<{ source: string; total: number }>(
      `SELECT source, COALESCE(SUM(amount), 0) as total FROM xp_events GROUP BY source`
    );
    const sourceMap: Record<string, number> = {};
    for (const r of sourceRows) {
      sourceMap[r.source] = r.total;
    }
    setXpBySource(sourceMap);

    // Sessions
    const sessions = await getSessionCount();
    setTotalSessions(sessions);
    const focusMins = await getTotalFocusMinutes();
    setTotalFocusMinutes(focusMins);

    // Tasks completed
    const taskRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`
    );
    setTotalTasksCompleted(taskRow?.count ?? 0);

    // Goals completed
    const goalRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM goals WHERE status = 'completed'`
    );
    setTotalGoalsCompleted(goalRow?.count ?? 0);

    // Flight logs
    const logs = await getAllFlightLogs();
    setFlightLogCount(logs.length);

    // Habit completion rates (last 30 days)
    const habitData: HabitStat[] = [];
    for (const habit of habits) {
      const expected = habit.frequency === 'weekdays' ? 22 : 30; // approx for 30 days
      const completionRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM habit_completions
         WHERE habit_id = ? AND date >= date('now', '-30 days')`,
        [habit.id]
      );
      const completions = completionRow?.count ?? 0;
      habitData.push({
        title: habit.title,
        completionRate: Math.min(Math.round((completions / expected) * 100), 100),
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
      });
    }
    setHabitStats(habitData);

    // Time spent by category (from focus sessions linked to categorized tasks)
    const catTimeRows = await db.getAllAsync<{ name: string; color: string; total_minutes: number }>(
      `SELECT c.name, c.color, COALESCE(SUM(fs.duration_minutes), 0) as total_minutes
       FROM focus_sessions fs
       JOIN tasks t ON fs.task_id = t.id
       JOIN categories c ON t.category_id = c.id
       WHERE fs.completed_at IS NOT NULL
       GROUP BY c.id
       ORDER BY total_minutes DESC`
    );
    // Also count uncategorized focus time
    const uncatRow = await db.getFirstAsync<{ total_minutes: number }>(
      `SELECT COALESCE(SUM(fs.duration_minutes), 0) as total_minutes
       FROM focus_sessions fs
       LEFT JOIN tasks t ON fs.task_id = t.id
       WHERE fs.completed_at IS NOT NULL AND (t.category_id IS NULL OR fs.task_id IS NULL)`
    );
    const catData = catTimeRows.map(r => ({ name: r.name, color: r.color, minutes: r.total_minutes }));
    const uncatMinutes = uncatRow?.total_minutes ?? 0;
    if (uncatMinutes > 0) {
      catData.push({ name: 'Uncategorized', color: Colors.text.tertiary, minutes: uncatMinutes });
    }
    setCategoryTime(catData);

    // Average daily XP (last 30 days)
    const avgRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM xp_events WHERE date(created_at) >= date('now', '-30 days')`
    );
    setAvgDailyXP(Math.round((avgRow?.total ?? 0) / 30));
  }, [habits]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxWeeklyXP = Math.max(...weeklyXP.map((w) => w.amount), 1);

  const SOURCE_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    habit: { label: 'Habits', icon: 'checkmark-circle', color: '#22C55E' },
    task: { label: 'Tasks', icon: 'checkbox', color: Colors.accent },
    session: { label: 'Focus', icon: 'timer', color: '#A78BFA' },
    streak_milestone: { label: 'Streaks', icon: 'flame', color: '#F97316' },
    goal_complete: { label: 'Goals', icon: 'flag', color: '#0D9488' },
    flight_log: { label: 'Reviews', icon: 'airplane', color: '#60A5FA' },
  };

  const totalSourceXP = Object.values(xpBySource).reduce((a, b) => a + b, 0) || 1;

  const styles = createStyles(Colors);
  const mStyles = createMilestoneStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analytics</Text>

        {/* Overview cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.accent + '15' }]}>
            <Ionicons name="flash" size={20} color={Colors.xp} />
            <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#A78BFA15' }]}>
            <Ionicons name="trending-up" size={20} color="#A78BFA" />
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F9731615' }]}>
            <Ionicons name="flame" size={20} color="#F97316" />
            <Text style={styles.statValue}>{overallStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#22C55E15' }]}>
            <Ionicons name="checkmark-done" size={20} color="#22C55E" />
            <Text style={styles.statValue}>{totalTasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
        </View>

        {/* Quick stats row */}
        <Card style={styles.quickStats}>
          <View style={styles.quickRow}>
            <View style={styles.quickItem}>
              <Text style={styles.quickValue}>{avgDailyXP}</Text>
              <Text style={styles.quickLabel}>Avg daily XP</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickValue}>{totalSessions}</Text>
              <Text style={styles.quickLabel}>Focus sessions</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickValue}>{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</Text>
              <Text style={styles.quickLabel}>Focus time</Text>
            </View>
          </View>
        </Card>

        {/* Weekly XP chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly XP</Text>
          <Card>
            <View style={styles.chartContainer}>
              {weeklyXP.map((week, i) => (
                <View key={i} style={styles.barColumn}>
                  <Text style={styles.barValue}>{week.amount}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max((week.amount / maxWeeklyXP) * 100, 4)}%`,
                          backgroundColor: i === weeklyXP.length - 1 ? Colors.accent : Colors.accent + '60',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, i === weeklyXP.length - 1 && { color: Colors.accent }]}>
                    {week.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* XP breakdown by source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>XP Sources</Text>
          <Card style={{ gap: Spacing.md }}>
            {Object.entries(xpBySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, amount]) => {
                const meta = SOURCE_LABELS[source] ?? { label: source, icon: 'ellipse' as const, color: Colors.text.tertiary };
                const pct = Math.round((amount / totalSourceXP) * 100);
                return (
                  <View key={source} style={styles.sourceRow}>
                    <View style={styles.sourceLeft}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                      <Text style={styles.sourceLabel}>{meta.label}</Text>
                    </View>
                    <View style={styles.sourceBarContainer}>
                      <View style={styles.sourceBarTrack}>
                        <View style={[styles.sourceBarFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                      </View>
                    </View>
                    <Text style={[styles.sourceAmount, { color: meta.color }]}>{amount.toLocaleString()}</Text>
                  </View>
                );
              })}
          </Card>
        </View>

        {/* Time by category */}
        {categoryTime.length > 0 && (() => {
          const totalCatMinutes = categoryTime.reduce((a, b) => a + b.minutes, 0) || 1;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time by Category</Text>
              <Card style={{ gap: Spacing.md }}>
                {categoryTime.map((cat, i) => {
                  const pct = Math.round((cat.minutes / totalCatMinutes) * 100);
                  const hrs = Math.floor(cat.minutes / 60);
                  const mins = cat.minutes % 60;
                  return (
                    <View key={i} style={styles.sourceRow}>
                      <View style={styles.sourceLeft}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
                        <Text style={styles.sourceLabel}>{cat.name}</Text>
                      </View>
                      <View style={styles.sourceBarContainer}>
                        <View style={styles.sourceBarTrack}>
                          <View style={[styles.sourceBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                        </View>
                      </View>
                      <Text style={[styles.sourceAmount, { color: cat.color }]}>
                        {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </View>
          );
        })()}

        {/* Habit performance */}
        {habitStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habit Performance (30d)</Text>
            <Card style={{ gap: Spacing.md }}>
              {habitStats.map((habit, i) => (
                <View key={i} style={styles.habitStatRow}>
                  <View style={styles.habitStatHeader}>
                    <Text style={styles.habitStatTitle} numberOfLines={1}>{habit.title}</Text>
                    <Text style={[styles.habitStatPct, { color: habit.completionRate >= 80 ? Colors.success : habit.completionRate >= 50 ? Colors.warning : Colors.danger }]}>
                      {habit.completionRate}%
                    </Text>
                  </View>
                  <View style={styles.habitBarTrack}>
                    <View
                      style={[
                        styles.habitBarFill,
                        {
                          width: `${habit.completionRate}%`,
                          backgroundColor: habit.completionRate >= 80 ? Colors.success : habit.completionRate >= 50 ? Colors.warning : Colors.danger,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.habitStreakRow}>
                    <Text style={styles.habitStreakText}>
                      <Ionicons name="flame" size={12} color={Colors.streakFire} /> {habit.currentStreak}d current
                    </Text>
                    <Text style={styles.habitStreakText}>
                      Best: {habit.longestStreak}d
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <Card style={{ gap: Spacing.lg }}>
            <MilestoneRow
              icon="trophy"
              color={tier.color}
              label="Current tier"
              value={`${tier.name} (Lv ${level})`}
            />
            <MilestoneRow
              icon="arrow-up-circle"
              color={Colors.xp}
              label="XP to next level"
              value={`${xpToNext > 0 ? xpToNext.toLocaleString() : 0} XP`}
            />
            <MilestoneRow
              icon="flame"
              color={Colors.streakFire}
              label="Longest streak"
              value={`${stats?.longestOverallStreak ?? 0} days`}
            />
            <MilestoneRow
              icon="flag"
              color="#0D9488"
              label="Goals completed"
              value={`${totalGoalsCompleted}`}
            />
            <MilestoneRow
              icon="airplane"
              color="#60A5FA"
              label="Flight logs"
              value={`${flightLogCount}`}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MilestoneRow({ icon, color, label, value }: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
}) {
  const Colors = useColors();
  const milestoneStyles = createMilestoneStyles(Colors);
  return (
    <View style={milestoneStyles.row}>
      <View style={[milestoneStyles.iconCircle, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={milestoneStyles.info}>
        <Text style={milestoneStyles.label}>{label}</Text>
        <Text style={[milestoneStyles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const createMilestoneStyles = (Colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: Typography.sm, color: Colors.text.secondary },
  value: { fontSize: Typography.md, fontWeight: Typography.semibold },
});

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
  },
  // Quick stats
  quickStats: {
    backgroundColor: Colors.background.secondary,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing['2xs'],
  },
  quickValue: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text.primary,
  },
  quickLabel: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border.subtle,
  },
  // Section
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  // Bar chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    gap: Spacing.md,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    height: '100%',
  },
  barValue: {
    fontSize: Typography.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.medium,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  barLabel: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  // XP sources
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 80,
  },
  sourceLabel: {
    fontSize: Typography.sm,
    color: Colors.text.primary,
  },
  sourceBarContainer: {
    flex: 1,
  },
  sourceBarTrack: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  sourceBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  sourceAmount: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    width: 50,
    textAlign: 'right',
  },
  // Habit performance
  habitStatRow: {
    gap: Spacing.xs,
  },
  habitStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitStatTitle: {
    fontSize: Typography.base,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  habitStatPct: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  habitBarTrack: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  habitBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  habitStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitStreakText: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
});

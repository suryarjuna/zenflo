import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useXP } from '@/hooks/useXP';
import { useStreaks } from '@/hooks/useStreaks';
import { useFlightLog } from '@/hooks/useFlightLog';
import { getSessionsForDate } from '@/db/sessions';
import { getGreeting, getQuoteOfTheDay } from '@/constants/quotes';
import { getLevelTier } from '@/constants/levels';
import { daysUntilSunday } from '@/utils/dates';
import { WeekStrip } from '@/components/ui/WeekStrip';
import { TodayProgress } from '@/components/ui/TodayProgress';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { XPBar } from '@/components/ui/XPBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { FocusSession, Goal, HabitCompletion } from '@/types';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const CATEGORY_COLORS = ['#60A5FA', '#E8853D', '#A78BFA'];
const GOAL_BORDER_COLORS = ['#0D9488', '#E8853D', '#A78BFA', '#22C55E', '#60A5FA'];

export function UnifiedHome() {
  const userName = useAppStore((s) => s.stats?.userName);
  const { todayTasks, refresh: refreshTasks, complete: completeTask } = useTasks();
  const { habits, refresh: refreshHabits, complete: completeHabit, getCompletionsForToday } = useHabits();
  const { goals, refresh: refreshGoals, getProgress } = useGoals();
  const { totalXP, level, progress } = useXP();
  const { overallStreak } = useStreaks();
  const { checkCanSubmit } = useFlightLog();

  const [intention, setIntention] = useState('');
  const [intentionSet, setIntentionSet] = useState(false);
  const [editingIntention, setEditingIntention] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [canSubmitLog, setCanSubmitLog] = useState(false);
  const [goalProgress, setGoalProgress] = useState<
    Record<string, { percent: number; completedTasks: number; totalTasks: number }>
  >({});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = format(new Date(), 'EEEE, MMM d');
  const intentionKey = `zenflo_intention_${format(new Date(), 'yyyy-MM-dd')}`;
  const greeting = getGreeting();
  const quote = getQuoteOfTheDay();
  const daysToSunday = daysUntilSunday();
  const tier = getLevelTier(level);

  const loadData = useCallback(async () => {
    await Promise.all([refreshTasks(), refreshHabits(), refreshGoals()]);
    const [todaySessions, comps, canSubmit] = await Promise.all([
      getSessionsForDate(),
      getCompletionsForToday(),
      checkCanSubmit(),
    ]);
    setSessions(todaySessions);
    setCompletions(comps);
    setCanSubmitLog(canSubmit);

    const saved = await AsyncStorage.getItem(intentionKey);
    if (saved) {
      setIntention(saved);
      setIntentionSet(true);
    }
  }, [refreshTasks, refreshHabits, refreshGoals, getCompletionsForToday, checkCanSubmit, intentionKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadProgress = async () => {
      const progressMap: Record<string, { percent: number; completedTasks: number; totalTasks: number }> = {};
      for (const goal of goals) {
        const p = await getProgress(goal.id);
        progressMap[goal.id] = p;
      }
      setGoalProgress(progressMap);
    };
    if (goals.length > 0) loadProgress();
  }, [goals, getProgress]);

  const saveIntention = async () => {
    if (intention.trim()) {
      await AsyncStorage.setItem(intentionKey, intention.trim());
      setIntentionSet(true);
      setEditingIntention(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    setCompletions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        habitId,
        date: new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString(),
      },
    ]);
    try {
      await completeHabit(habitId);
      const comps = await getCompletionsForToday();
      setCompletions(comps);
    } catch {
      const comps = await getCompletionsForToday();
      setCompletions(comps);
    }
  };

  const completedTaskCount = todayTasks.filter((t) => t.status === 'completed').length;
  const completedHabitIds = new Set(completions.map((c) => c.habitId));
  const completedHabitCount = habits.filter((h) => completedHabitIds.has(h.id)).length;
  const totalItems = todayTasks.length + habits.length;
  const completedItems = completedTaskCount + completedHabitCount;
  const focusTask = todayTasks.find((t) => t.status === 'pending');

  const goalMap = goals.reduce<Record<string, Goal>>((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 1. Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting}{userName ? `, ${userName}` : ''}
            </Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/modals/calendar')}
            accessibilityLabel="Calendar"
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* 2. Week strip */}
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          accentColor={Colors.accent}
        />

        {/* 3. Today's progress (combined) */}
        <TodayProgress
          completedCount={completedItems}
          totalCount={totalItems}
          accentColor={Colors.accent}
        />

        {/* 4. Quote of the day */}
        <View style={[styles.card, styles.quoteCard]}>
          <Text style={styles.quoteText}>{quote.text}</Text>
          {quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
        </View>

        {/* 5. Daily intention */}
        <View style={styles.section}>
          {!intentionSet || editingIntention ? (
            <View style={[styles.card, styles.intentionCard]}>
              <Text style={styles.sectionTitle}>Set your intention for today</Text>
              <TextInput
                style={styles.intentionInput}
                placeholder="What matters most today?"
                placeholderTextColor={Colors.text.tertiary}
                value={intention}
                onChangeText={setIntention}
                onSubmitEditing={saveIntention}
                returnKeyType="done"
                accessibilityLabel="Daily intention input"
              />
              <Button label="Set intention" onPress={saveIntention} disabled={!intention.trim()} />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingIntention(true)} accessibilityLabel="Edit intention">
              <View style={[styles.card, styles.intentionDisplay]}>
                <Ionicons name="sparkles" size={18} color={Colors.accent} />
                <Text style={styles.intentionText}>{intention}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 6. Up next — focus task */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Up next</Text>
          {focusTask ? (
            <View style={[styles.card, styles.focusCard]}>
              <View style={styles.focusContent}>
                <View style={styles.focusInfo}>
                  <Text style={styles.focusTaskTitle}>{focusTask.title}</Text>
                  <View style={styles.priorityRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            focusTask.priority === 'high'
                              ? Colors.danger
                              : focusTask.priority === 'medium'
                              ? Colors.warning
                              : Colors.text.tertiary,
                        },
                      ]}
                    />
                    <Text style={styles.priorityLabel}>{focusTask.priority} priority</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.startPill}
                  onPress={() =>
                    router.push({
                      pathname: '/modals/focus-session',
                      params: { taskId: focusTask.id, taskTitle: focusTask.title },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Start focus session"
                >
                  <Text style={styles.startPillText}>Start now</Text>
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Nothing to focus on. Enjoy the space.</Text>
            </View>
          )}
        </View>

        {/* 7. Daily habits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          {habits.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Add your first habit to build a routine.</Text>
            </View>
          ) : (
            <View style={styles.habitList}>
              {habits.map((habit, index) => {
                const isCompleted = completedHabitIds.has(habit.id);
                const dotColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={[styles.card, styles.habitRow, isCompleted && styles.habitRowCompleted]}
                    onPress={() => !isCompleted && handleCompleteHabit(habit.id)}
                    activeOpacity={isCompleted ? 1 : 0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${habit.title}${isCompleted ? ', completed' : ''}`}
                    accessibilityState={{ selected: isCompleted }}
                  >
                    <View style={styles.habitLeft}>
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                      ) : (
                        <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
                      )}
                      <Text
                        style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}
                        numberOfLines={1}
                      >
                        {habit.title}
                      </Text>
                    </View>
                    <View style={styles.habitRight}>
                      {habit.currentStreak > 0 && (
                        <View style={styles.streakBadge}>
                          <Ionicons name="flame" size={14} color={Colors.streakFire} />
                          <Text style={styles.streakBadgeText}>
                            {habit.currentStreak}d
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 8. Streak overview */}
        <View style={[styles.card, styles.streakHero]}>
          <StreakFlame count={overallStreak} size="lg" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{overallStreak}</Text>
            <Text style={styles.streakLabel}>
              {overallStreak > 0 ? 'day streak' : 'Start your streak today'}
            </Text>
          </View>
        </View>

        {/* 9. Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          {goals.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>A goal gives your habits direction. Add one.</Text>
            </View>
          ) : (
            <View style={styles.goalList}>
              {goals.map((goal, index) => {
                const gProgress = goalProgress[goal.id];
                const borderColor = GOAL_BORDER_COLORS[index % GOAL_BORDER_COLORS.length];
                return (
                  <View
                    key={goal.id}
                    style={[styles.card, styles.goalCard, { borderLeftColor: borderColor, borderLeftWidth: 4 }]}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              goal.status === 'completed'
                                ? Colors.success + '20'
                                : Colors.accent + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: goal.status === 'completed' ? Colors.success : Colors.accent,
                            },
                          ]}
                        >
                          {goal.status}
                        </Text>
                      </View>
                    </View>
                    {goal.targetDate && (
                      <Text style={styles.goalDate}>
                        Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                      </Text>
                    )}
                    {gProgress && (
                      <View style={styles.goalProgressContainer}>
                        <View style={styles.goalProgressTrack}>
                          <View
                            style={[
                              styles.goalProgressFill,
                              {
                                width: `${Math.round(gProgress.percent * 100)}%`,
                                backgroundColor: borderColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.goalProgressText}>
                          {gProgress.completedTasks}/{gProgress.totalTasks} tasks
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 10. Today's timeline (tasks) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          {todayTasks.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Nothing scheduled today.</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {todayTasks.map((task) => {
                const timeLabel = task.scheduledStart
                  ? format(new Date(task.scheduledStart), 'h:mm a')
                  : task.dueDate
                  ? format(new Date(task.dueDate), 'h:mm a')
                  : '';
                const isCompleted = task.status === 'completed';
                const goalTag = task.goalId ? goalMap[task.goalId] : undefined;

                return (
                  <View key={task.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <Text style={styles.timelineTime}>{timeLabel}</Text>
                    </View>
                    <View style={styles.timelineLine}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: isCompleted
                              ? Colors.success
                              : task.priority === 'high'
                              ? Colors.danger
                              : task.priority === 'medium'
                              ? Colors.warning
                              : Colors.accent,
                          },
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.card, styles.timelineCard, isCompleted && styles.timelineCardDone]}
                      onPress={() => !isCompleted && completeTask(task.id)}
                      activeOpacity={isCompleted ? 1 : 0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${task.title}${isCompleted ? ', completed' : ''}`}
                    >
                      <View style={styles.taskHeader}>
                        <Text
                          style={[styles.taskTitle, isCompleted && styles.taskTitleDone]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        {isCompleted && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                        )}
                      </View>
                      <View style={styles.taskMeta}>
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor:
                                task.priority === 'high'
                                  ? Colors.danger + '20'
                                  : task.priority === 'medium'
                                  ? Colors.warning + '20'
                                  : Colors.text.tertiary + '20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityBadgeText,
                              {
                                color:
                                  task.priority === 'high'
                                    ? Colors.danger
                                    : task.priority === 'medium'
                                    ? Colors.warning
                                    : Colors.text.tertiary,
                              },
                            ]}
                          >
                            {task.priority}
                          </Text>
                        </View>
                        {goalTag && (
                          <View style={styles.goalTagBadge}>
                            <Ionicons name="flag-outline" size={12} color={Colors.accent} />
                            <Text style={styles.goalTagText} numberOfLines={1}>
                              {goalTag.title}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 11. Flight Log CTA */}
        {canSubmitLog ? (
          <TouchableOpacity
            style={[styles.card, styles.flightLogReady]}
            onPress={() => router.push('/modals/flight-log')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open weekly flight log"
          >
            <Ionicons name="airplane" size={24} color="#FFFFFF" />
            <View style={styles.flightLogInfo}>
              <Text style={styles.flightLogTitle}>Weekly Flight Log</Text>
              <Text style={styles.flightLogSub}>Your review is ready to submit</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.card, styles.flightLogWait]}>
            <Ionicons name="airplane-outline" size={20} color={Colors.text.tertiary} />
            <Text style={styles.flightLogWaitText}>
              {daysToSunday === 0
                ? 'Flight log already submitted this week.'
                : `Next review: Sunday \u00B7 ${daysToSunday} day${daysToSunday !== 1 ? 's' : ''} away`}
            </Text>
          </View>
        )}

        {/* 12. XP + Level */}
        <View style={[styles.card, styles.levelCard]}>
          <Text style={[styles.levelName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={styles.levelNumber}>Level {level}</Text>
          <XPBar currentXP={progress.current} totalXP={progress.required} level={level} />
          <Text style={styles.xpNeeded}>
            {progress.required - progress.current} XP to next level
          </Text>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/modals/add')}
        accessibilityRole="button"
        accessibilityLabel="Add new"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 100,
    gap: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.accent,
  },
  date: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    ...CARD_SHADOW,
  },
  // Quote
  quoteCard: {
    backgroundColor: Colors.surface.warm,
  },
  quoteText: {
    fontSize: Typography.base,
    fontStyle: 'italic',
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: Typography.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  // Intention
  intentionCard: {
    gap: Spacing.md,
  },
  intentionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  intentionInput: {
    fontSize: Typography.lg,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingVertical: Spacing.sm,
  },
  intentionText: {
    fontSize: Typography.lg,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
    lineHeight: 28,
    flex: 1,
  },
  // Focus task
  focusCard: {
    gap: Spacing.sm,
  },
  focusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  focusInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  focusTaskTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  priorityLabel: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  startPillText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: '#FFFFFF',
  },
  // Habits
  habitList: {
    gap: Spacing.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  habitRowCompleted: {
    opacity: 0.6,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  habitTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
    flex: 1,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  streakBadgeText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
  // Streak hero
  streakHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surface.warmLight,
  },
  streakInfo: {
    gap: Spacing['2xs'],
  },
  streakNumber: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    color: Colors.accent,
  },
  streakLabel: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  // Goals
  goalList: {
    gap: Spacing.md,
  },
  goalCard: {
    gap: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textTransform: 'capitalize',
  },
  goalDate: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  goalProgressContainer: {
    gap: Spacing.xs,
  },
  goalProgressTrack: {
    height: 5,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  goalProgressText: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
  },
  // Timeline
  timelineContainer: {
    gap: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingTop: Spacing.lg,
  },
  timelineTime: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.medium,
  },
  timelineLine: {
    alignItems: 'center',
    paddingTop: Spacing.lg + 2,
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  timelineCard: {
    flex: 1,
    gap: Spacing.sm,
  },
  timelineCardDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    borderRadius: Radius.sm,
  },
  priorityBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textTransform: 'capitalize',
  },
  goalTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    borderRadius: Radius.sm,
  },
  goalTagText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: Typography.medium,
    maxWidth: 100,
  },
  // Flight log
  flightLogReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.accent,
  },
  flightLogInfo: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  flightLogTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: '#FFFFFF',
  },
  flightLogSub: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  flightLogWait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flightLogWaitText: {
    fontSize: Typography.sm,
    color: Colors.text.tertiary,
  },
  // Level card
  levelCard: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  levelName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
  },
  levelNumber: {
    fontSize: Typography.sm,
    color: Colors.text.secondary,
  },
  xpNeeded: {
    fontSize: Typography.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
    shadowOpacity: 0.25,
  },
});

import { Platform } from 'react-native';
import { getTasksForToday } from '../db/tasks';
import { getAllHabits, getHabitCompletionsForDate } from '../db/habits';
import { todayISO, nowISO } from './dates';
import type { Habit } from '../types';

/**
 * Determines if a habit is scheduled for today based on its frequency.
 */
function isHabitDueToday(habit: Habit): boolean {
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ...
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return today >= 1 && today <= 5;
    case 'custom':
      return habit.customDays?.includes(today) ?? false;
    default:
      return true;
  }
}

/**
 * Syncs current tasks and habits to the iOS widget via shared UserDefaults.
 * Safe to call on any platform — no-ops on non-iOS.
 */
export async function syncWidgetData(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const { setWidgetData } = await import('../../modules/widget-sync');

    const [tasks, allHabits, completions] = await Promise.all([
      getTasksForToday(),
      getAllHabits(),
      getHabitCompletionsForDate(todayISO()),
    ]);

    const completedHabitIds = new Set(completions.map((c) => c.habitId));
    const todayHabits = allHabits.filter(isHabitDueToday);

    const widgetData = {
      pendingTasks: tasks.slice(0, 8).map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate ?? null,
      })),
      todayHabits: todayHabits.slice(0, 8).map((h) => ({
        id: h.id,
        title: h.title,
        completed: completedHabitIds.has(h.id),
        currentStreak: h.currentStreak,
      })),
      stats: {
        totalHabits: todayHabits.length,
        completedHabits: todayHabits.filter((h) => completedHabitIds.has(h.id)).length,
        pendingTaskCount: tasks.length,
      },
      lastUpdated: nowISO(),
    };

    await setWidgetData(JSON.stringify(widgetData));
  } catch {
    // Widget sync is non-critical — silently ignore errors
  }
}

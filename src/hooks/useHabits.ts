import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAllHabits, createHabit, completeHabit, archiveHabit, getHabitCompletionsForDate } from '../db/habits';
import { getUserStats } from '../db/xp';
import { todayISO } from '../utils/dates';
import type { Habit, HabitCompletion, HabitFrequency, XPWeight } from '../types';

export function useHabits() {
  const habits = useAppStore((s) => s.habits);
  const setHabits = useAppStore((s) => s.setHabits);
  const setStats = useAppStore((s) => s.setStats);
  const setLevelUp = useAppStore((s) => s.setLevelUp);
  const addXPGain = useAppStore((s) => s.addXPGain);

  const refresh = useCallback(async () => {
    const h = await getAllHabits();
    setHabits(h);
  }, [setHabits]);

  const add = useCallback(async (data: {
    title: string;
    goalId?: string;
    frequency?: HabitFrequency;
    customDays?: number[];
    xpWeight?: XPWeight;
  }) => {
    const habit = await createHabit(data);
    await refresh();
    return habit;
  }, [refresh]);

  const complete = useCallback(async (habitId: string) => {
    const date = todayISO();
    const result = await completeHabit(habitId, date);
    if (result.xpEarned > 0) {
      addXPGain(result.xpEarned);
    }
    const stats = await getUserStats();
    setStats(stats);
    if (stats.level > (useAppStore.getState().stats?.level ?? 1)) {
      setLevelUp(stats.level);
    }
    await refresh();
    return result;
  }, [refresh, addXPGain, setStats, setLevelUp]);

  const archive = useCallback(async (id: string) => {
    await archiveHabit(id);
    await refresh();
  }, [refresh]);

  const getCompletionsForToday = useCallback(async (): Promise<HabitCompletion[]> => {
    return getHabitCompletionsForDate(todayISO());
  }, []);

  return { habits, refresh, add, complete, archive, getCompletionsForToday };
}

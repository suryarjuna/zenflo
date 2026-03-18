import { useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isStreakAtRisk } from '../utils/streaks';
import type { Habit } from '../types';

export function useStreaks() {
  const habits = useAppStore((s) => s.habits);
  const stats = useAppStore((s) => s.stats);

  const overallStreak = stats?.overallStreak ?? 0;

  const habitsAtRisk = habits.filter(h => isStreakAtRisk(h.lastCompletedDate));

  const longestHabitStreak = habits.reduce(
    (max, h) => Math.max(max, h.longestStreak),
    0
  );

  return {
    overallStreak,
    habitsAtRisk,
    longestHabitStreak,
  };
}

import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAllActiveGoals, createGoal, updateGoal, completeGoal, getGoalProgress } from '../db/goals';
import { getUserStats } from '../db/xp';
import type { Goal } from '../types';

export function useGoals() {
  const goals = useAppStore((s) => s.goals);
  const setGoals = useAppStore((s) => s.setGoals);
  const setStats = useAppStore((s) => s.setStats);
  const setLevelUp = useAppStore((s) => s.setLevelUp);
  const addXPGain = useAppStore((s) => s.addXPGain);

  const refresh = useCallback(async () => {
    const g = await getAllActiveGoals();
    setGoals(g);
  }, [setGoals]);

  const add = useCallback(async (data: { title: string; description?: string; targetDate?: string; importance?: 'high' | 'medium' | 'low'; categoryId?: string }) => {
    const goal = await createGoal(data);
    await refresh();
    return goal;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Goal>) => {
    await updateGoal(id, updates);
    await refresh();
  }, [refresh]);

  const complete = useCallback(async (id: string) => {
    await completeGoal(id);
    addXPGain(200);
    const stats = await getUserStats();
    setStats(stats);
    await refresh();
  }, [refresh, addXPGain, setStats]);

  const getProgress = useCallback(async (goalId: string) => {
    return getGoalProgress(goalId);
  }, []);

  return { goals, refresh, add, update, complete, getProgress };
}

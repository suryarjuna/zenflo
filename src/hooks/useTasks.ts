import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getTasksForToday, getAllPendingTasks, createTask, completeTask, updateTask, deleteTask } from '../db/tasks';
import { getUserStats } from '../db/xp';
import type { Task, TaskPriority } from '../types';

export function useTasks() {
  const todayTasks = useAppStore((s) => s.todayTasks);
  const setTodayTasks = useAppStore((s) => s.setTodayTasks);
  const setStats = useAppStore((s) => s.setStats);
  const addXPGain = useAppStore((s) => s.addXPGain);
  const setLevelUp = useAppStore((s) => s.setLevelUp);

  const refresh = useCallback(async () => {
    const tasks = await getTasksForToday();
    setTodayTasks(tasks);
  }, [setTodayTasks]);

  const add = useCallback(async (data: {
    title: string;
    goalId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    isRecurring?: boolean;
    recurringInterval?: Task['recurringInterval'];
    scheduledStart?: string;
    scheduledEnd?: string;
    calendarEventId?: string;
    isEvent?: boolean;
    eventType?: string;
  }) => {
    const task = await createTask(data);
    await refresh();
    return task;
  }, [refresh]);

  const complete = useCallback(async (id: string) => {
    await completeTask(id);
    addXPGain(5);
    const stats = await getUserStats();
    setStats(stats);
    if (stats.level > (useAppStore.getState().stats?.level ?? 1)) {
      setLevelUp(stats.level);
    }
    await refresh();
  }, [refresh, addXPGain, setStats, setLevelUp]);

  const update = useCallback(async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteTask(id);
    await refresh();
  }, [refresh]);

  return { todayTasks, refresh, add, complete, update, remove };
}

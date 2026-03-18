import { create } from 'zustand';
import type { UserStats, Goal, Habit, Task } from '../types';

interface AppState {
  stats: UserStats | null;
  goals: Goal[];
  habits: Habit[];
  todayTasks: Task[];
  pendingXPGains: { amount: number; id: string }[];
  justLeveledUp: boolean;
  newLevel: number;

  setStats: (s: UserStats) => void;
  setGoals: (g: Goal[]) => void;
  setHabits: (h: Habit[]) => void;
  setTodayTasks: (t: Task[]) => void;
  addXPGain: (amount: number) => void;
  clearXPGains: () => void;
  setLevelUp: (level: number) => void;
  clearLevelUp: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  stats: null,
  goals: [],
  habits: [],
  todayTasks: [],
  pendingXPGains: [],
  justLeveledUp: false,
  newLevel: 1,
  setStats: (stats) => set({ stats }),
  setGoals: (goals) => set({ goals }),
  setHabits: (habits) => set({ habits }),
  setTodayTasks: (todayTasks) => set({ todayTasks }),
  addXPGain: (amount) =>
    set((s) => ({
      pendingXPGains: [...s.pendingXPGains, { amount, id: String(Date.now()) }],
    })),
  clearXPGains: () => set({ pendingXPGains: [] }),
  setLevelUp: (level) => set({ justLeveledUp: true, newLevel: level }),
  clearLevelUp: () => set({ justLeveledUp: false }),
}));

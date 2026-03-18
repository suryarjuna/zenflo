# Zenflo — Claude Code Build Brief
**Version:** 1.0  
**Stack:** React Native + Expo (TypeScript) + SQLite (local-first)  
**Target:** iOS + Android  
**Instruction type:** End-to-end implementation guide for Claude Code

---

## 0. How to Read This Brief

This document is the complete specification for building Zenflo from scratch. Work through it **section by section, in order**. Each section ends with a checklist. Do not proceed to the next section until all items in the current checklist are passing. When in doubt, refer back to the Design Principles in Section 2.

---

## 1. Project Bootstrap

### 1.1 Initialise the project

```bash
npx create-expo-app@latest zenflo --template blank-typescript
cd zenflo
```

### 1.2 Install all dependencies up front

```bash
# Navigation
npx expo install expo-router

# Database
npx expo install expo-sqlite

# UI + Animations
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install expo-haptics
npx expo install expo-blur

# Notifications
npx expo install expo-notifications

# Background tasks
npx expo install expo-task-manager
npx expo install expo-background-fetch

# Storage
npx expo install @react-native-async-storage/async-storage

# SVG (for progress rings)
npx expo install react-native-svg

# Screen awake during focus sessions
npx expo install expo-keep-awake

# Date handling
npm install date-fns

# State management
npm install zustand

# Icons
npm install @expo/vector-icons

# Confetti for level-up
npm install react-native-confetti-cannon

# Share cards
npx expo install expo-sharing
npx expo install react-native-view-shot

# Dev
npm install --save-dev @types/react @types/react-native
```

### 1.3 Configure app.json

```json
{
  "expo": {
    "name": "Zenflo",
    "slug": "zenflo",
    "scheme": "zenflo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": { "backgroundColor": "#0F0E17" },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.zenflo.app"
    },
    "android": {
      "adaptiveIcon": { "backgroundColor": "#0F0E17" },
      "package": "com.zenflo.app"
    },
    "plugins": [
      "expo-router",
      "expo-sqlite",
      ["expo-notifications", { "color": "#6C63FF" }]
    ]
  }
}
```

### 1.4 tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 1.5 File structure

```
zenflo/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── monk.tsx
│   │   ├── athlete.tsx
│   │   └── pilot.tsx
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── goal.tsx
│   │   ├── habits.tsx
│   │   ├── xp-weights.tsx
│   │   └── first-session.tsx
│   ├── modals/
│   │   ├── add-goal.tsx
│   │   ├── add-habit.tsx
│   │   ├── add-task.tsx
│   │   ├── focus-session.tsx
│   │   └── flight-log.tsx
│   └── settings.tsx
├── src/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── database.ts
│   │   ├── goals.ts
│   │   ├── habits.ts
│   │   ├── tasks.ts
│   │   ├── sessions.ts
│   │   ├── flight-logs.ts
│   │   └── xp.ts
│   ├── store/
│   │   ├── useAppStore.ts
│   │   └── useModeStore.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── StreakFlame.tsx
│   │   │   ├── XPBar.tsx
│   │   │   └── Badge.tsx
│   │   ├── habits/
│   │   │   ├── HabitCard.tsx
│   │   │   └── HabitGrid.tsx
│   │   ├── goals/
│   │   │   └── GoalCard.tsx
│   │   ├── tasks/
│   │   │   └── TaskItem.tsx
│   │   ├── modes/
│   │   │   └── ModeSwitcher.tsx
│   │   └── flight-log/
│   │       └── FlightLogCard.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useGoals.ts
│   │   ├── useHabits.ts
│   │   ├── useTasks.ts
│   │   ├── useStreaks.ts
│   │   ├── useXP.ts
│   │   ├── useFlightLog.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── xp.ts
│   │   ├── streaks.ts
│   │   ├── levels.ts
│   │   ├── dates.ts
│   │   └── shareCard.ts
│   ├── constants/
│   │   ├── theme.ts
│   │   ├── modes.ts
│   │   ├── levels.ts
│   │   └── badges.ts
│   └── types/
│       └── index.ts
└── ZENFLO_BUILD_BRIEF.md
```

### Bootstrap checklist
- [ ] `npx expo start` runs with zero errors
- [ ] TypeScript strict mode compiles cleanly
- [ ] All packages installed and linked
- [ ] File structure created

---

## 2. Design System and Theme

### 2.1 Design principles

Internalise these before writing any UI code:

1. **Minimal but not empty** — whitespace is intentional. Every element earns its place.
2. **Mode-adaptive** — the UI personality shifts per mode. Monk is near-monochrome. Athlete has energy. Pilot is a dashboard.
3. **Tactile** — every meaningful interaction has haptic feedback.
4. **Dark-first** — default theme is dark. Light mode supported.
5. **No chrome** — avoid unnecessary headers and decorations. Let content breathe.

### 2.2 Colour tokens — `src/constants/theme.ts`

```typescript
export const Colors = {
  background: {
    primary:   '#0F0E17',
    secondary: '#1A1929',
    tertiary:  '#252438',
    elevated:  '#2D2C45',
  },
  accent:      '#6C63FF',
  accentMuted: '#4B44B3',
  monk: {
    primary:    '#A78BFA',
    background: '#0D0C1A',
    text:       '#E8E3FF',
  },
  athlete: {
    primary:    '#F97316',
    background: '#1A0F05',
    text:       '#FFF0E5',
  },
  pilot: {
    primary:    '#0D9488',
    background: '#051A18',
    text:       '#E0F7F5',
  },
  success: '#22C55E',
  warning: '#EAB308',
  danger:  '#EF4444',
  xp:      '#FBBF24',
  text: {
    primary:   '#F4F3FF',
    secondary: '#9B99C5',
    tertiary:  '#5C5A80',
    inverse:   '#0F0E17',
  },
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.12)',
    strong:  'rgba(255,255,255,0.24)',
  },
  streakFire:   '#FF6B35',
  streakGold:   '#FFD700',
  streakFrozen: '#60A5FA',
};

export const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 30, '3xl': 38, '4xl': 48,
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  black:   '900' as const,
};

export const Spacing = {
  '2xs': 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
};

export const Radius = {
  sm: 6, md: 10, lg: 16, xl: 24, full: 9999,
};
```

### 2.3 Mode definitions — `src/constants/modes.ts`

```typescript
export type Mode = 'monk' | 'athlete' | 'pilot';

export const Modes = {
  monk: {
    id: 'monk' as Mode,
    label: 'Monk Mode',
    tagline: 'Focus. One task. Silence.',
    primaryColor: '#A78BFA',
    backgroundColor: '#0D0C1A',
    tabIcon: 'moon',
  },
  athlete: {
    id: 'athlete' as Mode,
    label: 'Athlete Mode',
    tagline: 'Build. Streak. Momentum.',
    primaryColor: '#F97316',
    backgroundColor: '#1A0F05',
    tabIcon: 'flame',
  },
  pilot: {
    id: 'pilot' as Mode,
    label: 'Pilot Mode',
    tagline: 'Plan. Review. Command.',
    primaryColor: '#0D9488',
    backgroundColor: '#051A18',
    tabIcon: 'compass',
  },
};
```

### 2.4 Level definitions — `src/constants/levels.ts`

```typescript
export const LevelTiers = [
  { min: 1,  max: 4,   name: 'Initiate',     color: '#9CA3AF' },
  { min: 5,  max: 9,   name: 'Practitioner', color: '#60A5FA' },
  { min: 10, max: 14,  name: 'Monk',         color: '#A78BFA' },
  { min: 15, max: 19,  name: 'Athlete',      color: '#F97316' },
  { min: 20, max: 29,  name: 'Pilot',        color: '#0D9488' },
  { min: 30, max: 39,  name: 'Navigator',    color: '#22C55E' },
  { min: 40, max: 49,  name: 'Architect',    color: '#FBBF24' },
  { min: 50, max: 999, name: 'Zenmaster',    color: '#6C63FF' },
];

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * ((1.2 ** (level - 1) - 1) / 0.2));
}

export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export function getLevelTier(level: number) {
  return LevelTiers.find(t => level >= t.min && level <= t.max) ?? LevelTiers[0];
}

export function xpProgressInCurrentLevel(totalXP: number) {
  const level = levelFromXP(totalXP);
  const current = totalXP - xpForLevel(level);
  const required = xpForLevel(level + 1) - xpForLevel(level);
  return { current, required, percent: current / required };
}
```

### Design system checklist
- [ ] All colour, typography, spacing, and radius tokens defined
- [ ] Mode definitions exported with correct colours
- [ ] Level curve functions verified: level 1 = 0 XP, level 2 = 100 XP, level 3 = 220 XP
- [ ] Zero hardcoded colour values in any component file

---

## 3. TypeScript Types — `src/types/index.ts`

```typescript
export type Mode          = 'monk' | 'athlete' | 'pilot';
export type XPWeight      = 1 | 2 | 3;
export type GoalStatus    = 'active' | 'completed' | 'paused';
export type TaskPriority  = 'high' | 'medium' | 'low';
export type TaskStatus    = 'pending' | 'completed' | 'cancelled';
export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  goalId?: string;
  title: string;
  frequency: HabitFrequency;
  customDays?: number[];        // 0=Sun … 6=Sat
  xpWeight: XPWeight;
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;         // 0–2
  lastCompletedDate?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;                 // YYYY-MM-DD
  completedAt: string;
}

export interface Task {
  id: string;
  goalId?: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  completedAt?: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  wasInterrupted: boolean;
}

export interface FlightLog {
  id: string;
  weekStartDate: string;        // ISO Monday date
  habitScore: number;           // 0–100
  tasksCompleted: number;
  xpEarned: number;
  longestStreak: number;
  bestMoment: string;
  courseCorrection: string;
  completedAt: string;
}

export interface XPEvent {
  id: string;
  source: 'habit' | 'task' | 'session' | 'streak_milestone' | 'goal_complete' | 'flight_log';
  sourceId?: string;
  amount: number;
  createdAt: string;
}

export interface UserStats {
  totalXP: number;
  level: number;
  overallStreak: number;
  longestOverallStreak: number;
  totalFocusMinutes: number;
  flightLogsCompleted: number;
  lastActiveDate: string;
  onboardingComplete: boolean;
}

export interface Badge {
  id: string;
  unlockedAt: string;
}
```

---

## 4. Database Layer

### 4.1 Schema — `src/db/schema.ts`

```typescript
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    overall_streak INTEGER NOT NULL DEFAULT 0,
    longest_overall_streak INTEGER NOT NULL DEFAULT 0,
    total_focus_minutes INTEGER NOT NULL DEFAULT 0,
    flight_logs_completed INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    onboarding_complete INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily',
    custom_days TEXT,
    xp_weight INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    freeze_tokens INTEGER NOT NULL DEFAULT 1,
    last_completed_date TEXT,
    created_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE IF NOT EXISTS habit_completions (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    UNIQUE(habit_id, date)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_interval TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    was_interrupted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS flight_logs (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL UNIQUE,
    habit_score REAL NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    best_moment TEXT NOT NULL DEFAULT '',
    course_correction TEXT NOT NULL DEFAULT '',
    completed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS xp_events (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL
  );

  INSERT OR IGNORE INTO user_stats (id, last_active_date)
  VALUES (1, date('now'));
`;
```

### 4.2 Database singleton — `src/db/database.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('zenflo.db');
  await _db.execAsync(CREATE_TABLES);
  const row = await _db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );
  if (!row) {
    await _db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  }
  return _db;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

### 4.3 Streak utilities — `src/utils/streaks.ts`

```typescript
import { parseISO, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

export function calculateStreak(sortedDatesDesc: string[]): number {
  if (!sortedDatesDesc.length) return 0;
  const dates = sortedDatesDesc.map(d => parseISO(d));
  if (!isToday(dates[0]) && !isYesterday(dates[0])) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(dates[i - 1], dates[i]);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function isStreakAtRisk(lastCompletedDate?: string): boolean {
  if (!lastCompletedDate) return false;
  return isYesterday(parseISO(lastCompletedDate));
}

export const STREAK_MILESTONES = [7, 14, 21, 30, 60, 100, 150, 200, 365];

export function streakBonusXP(streak: number): number {
  const bonuses: Record<number, number> = {
    7: 50, 14: 30, 21: 50, 30: 75, 60: 100, 100: 200, 150: 250, 200: 300, 365: 500,
  };
  return bonuses[streak] ?? 0;
}
```

### 4.4 Habits queries — `src/db/habits.ts`

Implement all of the following functions completely:

```typescript
getAllHabits(): Promise<Habit[]>
getHabitById(id: string): Promise<Habit | null>
createHabit(data: CreateHabitInput): Promise<Habit>
updateHabit(id: string, updates: Partial<Habit>): Promise<void>
archiveHabit(id: string): Promise<void>

completeHabit(habitId: string, date: string): Promise<{
  xpEarned: number;
  newStreak: number;
  isNewRecord: boolean;
  milestoneReached: number | null;
}>
```

**`completeHabit` must do the following in a single transaction:**
1. Insert into `habit_completions` with `INSERT OR IGNORE` (idempotent)
2. Fetch all completion dates for this habit, sorted descending
3. Call `calculateStreak()` to get the new streak
4. Update `current_streak` and `longest_streak` on the habit row
5. Compute `xpEarned = 10 * xp_weight`
6. If streak is a milestone, add bonus XP from `streakBonusXP()`
7. If streak hits 14 (or any multiple of 14), call `earnFreezeToken()`
8. Insert an `xp_events` row
9. Call `awardXP()` to update `user_stats`
10. Return the result object

Also implement:
```typescript
getHabitCompletionsForDate(date: string): Promise<HabitCompletion[]>
getHabitCompletionsForWeek(habitId: string, weekStart: string): Promise<HabitCompletion[]>
earnFreezeToken(habitId: string): Promise<void>       // max 2 tokens
consumeFreezeToken(habitId: string): Promise<boolean>  // returns true if consumed
```

### 4.5 Remaining DB modules

Implement `src/db/goals.ts`, `src/db/tasks.ts`, `src/db/sessions.ts`, `src/db/flight-logs.ts`, and `src/db/xp.ts` following the same pattern.

**Key functions per module:**

`goals.ts`: `getAllActiveGoals`, `createGoal`, `updateGoal`, `completeGoal` (awards 200 XP), `getGoalProgress`

`tasks.ts`: `getTasksForToday`, `getAllPendingTasks`, `createTask`, `completeTask` (awards 5 XP, resets recurring), `updateTask`, `deleteTask`

`sessions.ts`: `startSession`, `completeSession` (awards 15 XP if >= 5 min), `getSessionsForDate`, `getTotalFocusMinutes`

`flight-logs.ts`: `canSubmitFlightLog` (true on Sunday + no log this week), `getFlightLogData` (aggregates full week), `submitFlightLog` (awards 30 XP), `getAllFlightLogs`, `getFlightLogByWeek`

`xp.ts`:
```typescript
export async function awardXP(
  source: XPEvent['source'],
  sourceId: string | undefined,
  amount: number
): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }>
```
This function must: insert the `xp_events` row, update `user_stats.total_xp`, recalculate the level using `levelFromXP()`, detect a level change, and return the result.

### Database layer checklist
- [ ] All tables created on first app launch
- [ ] `completeHabit()` is idempotent — calling it twice for same date gives same result
- [ ] Streaks calculate correctly: today completion, yesterday gap, multi-day gap
- [ ] `awardXP()` detects level-up correctly
- [ ] `completeGoal()` sets status and awards 200 XP
- [ ] `submitFlightLog()` blocked if already submitted this week
- [ ] All queries use parameterised values — no string interpolation

---

## 5. State Management

### `src/store/useAppStore.ts`

```typescript
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
```

### `src/store/useModeStore.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mode } from '../types';

interface ModeState {
  currentMode: Mode;
  setMode: (mode: Mode) => Promise<void>;
  loadMode: () => Promise<void>;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: 'monk',
  setMode: async (mode) => {
    set({ currentMode: mode });
    await AsyncStorage.setItem('zenflo_mode', mode);
  },
  loadMode: async () => {
    const saved = await AsyncStorage.getItem('zenflo_mode');
    if (saved) set({ currentMode: saved as Mode });
  },
}));
```

---

## 6. Root Layout and Navigation

### `app/_layout.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDatabase } from '@/db/database';
import { getUserStats } from '@/db/xp';
import { useAppStore } from '@/store/useAppStore';
import { useModeStore } from '@/store/useModeStore';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setStats = useAppStore((s) => s.setStats);
  const loadMode = useModeStore((s) => s.loadMode);

  useEffect(() => {
    (async () => {
      await getDatabase();
      await loadMode();
      setStats(await getUserStats());
      setReady(true);
    })();
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.background.primary }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modals/focus-session" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modals/flight-log"    options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modals/add-goal"      options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/add-habit"     options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/add-task"      options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

### `app/index.tsx`

```typescript
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const stats = useAppStore((s) => s.stats);
  useEffect(() => {
    if (!stats) return;
    router.replace(stats.onboardingComplete ? '/(tabs)/monk' : '/onboarding/welcome');
  }, [stats]);
  return null;
}
```

### `app/(tabs)/_layout.tsx`

Build the tab bar with these requirements:
- Background: `Colors.background.secondary` with a top border in `Colors.border.subtle`
- Three tabs: Monk (moon icon), Athlete (flame icon), Pilot (compass icon)
- Active tab icon uses the mode's `primaryColor`
- Tab label: 10px, `Colors.text.secondary` inactive, mode primary colour active
- Switching tabs calls `useModeStore.setMode()` and triggers a 300ms animated background colour crossfade
- `useModeStore` is the source of truth for `initialRouteName`

---

## 7. Onboarding Flow

Five screens in `app/onboarding/`. Build them in order. Rules:
- Progress dots at top: current screen filled, others hollow
- Large typography, generous whitespace
- One primary CTA per screen, always at the bottom
- Cannot skip

### Screen 1 — `welcome.tsx`
- Full-screen with `Colors.background.primary`
- Animated "ZENFLO" wordmark fades in
- Tagline: "Get in the zone. Own your week."
- Three mode icons appear in sequence with a subtle fade
- CTA: "Let's build your flow" — navigates to `goal.tsx`

### Screen 2 — `goal.tsx`
- Heading: "What's the one thing you're working toward?"
- Subtitle: "Start with what matters most right now."
- Large text input for goal title
- Optional target date picker
- Save goal to state (not yet to DB — commit all at onboarding end)
- CTA: "Set this goal" (disabled until title entered)

### Screen 3 — `habits.tsx`
- Shows the goal from screen 2 at top as context
- Heading: "What 3 habits will get you there?"
- Three habit input rows (title + frequency dropdown each)
- Minimum 1 habit required
- CTA: "These are my habits"

### Screen 4 — `xp-weights.tsx`
- Heading: "Not all habits are equal."
- Subtitle: "Tell Zenflo which ones matter most."
- Each habit from screen 3 shown with a three-option weight selector: Standard (1x / 10 XP), Important (2x / 20 XP), Critical (3x / 30 XP)
- Live XP preview updates as selection changes
- CTA: "Got it"

### Screen 5 — `first-session.tsx`
- Heading: "Welcome to Zenflo."
- Subtitle: "Start with 5 minutes of focus."
- Minimal countdown timer set to 5:00
- "Begin" starts the timer
- On completion: celebrate with animation + XP awarded
- **Writes all onboarding data to DB here:** goal, habits with weights, `onboarding_complete = 1`
- Transition to `/(tabs)/monk`

---

## 8. Mode Screens

Each screen follows this layout:
```
Mode header (mode label + XP bar)
Date + greeting
Primary content (scrollable)
FAB (+)
```

### Monk Mode — `app/(tabs)/monk.tsx`

Visual character: minimal, near-monochrome, breathing room.

**Sections top to bottom:**
1. Mode header — "Monk Mode" label, today's date, small XP bar
2. Daily intention — if not set today: prompt card "Set your intention for today." On tap: inline or modal text entry. If set: shows intention in large calm typography
3. Focus task — the single highest-priority pending task. Big card. "Begin session" button opens `modals/focus-session`
4. Today's sessions — compact list of focus sessions completed today. Empty state: "No sessions yet. Your first one earns 15 XP."
5. Monk streak — consecutive days with at least one focus session

FAB opens add-task modal.

### Athlete Mode — `app/(tabs)/athlete.tsx`

Visual character: energetic, progress-forward, streaks are the hero.

**Sections top to bottom:**
1. Mode header — "Athlete Mode" + overall streak flame if streak > 0
2. Overall streak — large centred: flame icon + streak number + "day streak"
3. Today's habit grid — 2-column grid of `HabitCard` components. Tap to complete with animation + haptic
4. Weekly habit score — horizontal progress bar, "This week: X% complete"
5. Personal records — compact row of longest streaks per habit

FAB opens add-habit modal.

### Pilot Mode — `app/(tabs)/pilot.tsx`

Visual character: calm dashboard, command centre.

**Sections top to bottom:**
1. Mode header — "Pilot Mode"
2. Flight Log CTA — if Sunday and no log this week: glowing card "Your weekly flight log is ready." On other days: "Next review: Sunday · X days away"
3. Goal cockpit — active goals list. Each card: title, target date, progress bar, status badge. Tap to see detail
4. This week's tasks — pending tasks filtered to this week, grouped by goal
5. Level + XP card — level name, XP progress bar, XP needed for next level

FAB opens bottom sheet: "Add Goal" or "Add Task".

---

## 9. Focus Session Modal — `app/modals/focus-session.tsx`

Full-screen modal with `Colors.monk.background`.

### States

**Pre-start:** Duration selector pills (25 / 50 / 90 / custom min). Optional task link. "Begin session" CTA.

**Running:**
- Timer in massive typography (60–70% of viewport)
- Subtle circular progress ring behind numbers (use `ProgressRing` component)
- Task title above timer in small text
- Pause (⏸) and abandon (×) controls
- Screen kept awake via `expo-keep-awake`
- Haptic pulse every 5 minutes

**Paused:**
- Timer frozen, display dimmed
- "Resume" button prominent
- "End session early" (awards partial XP if >= 5 min elapsed)

**Completed:**
- Full-screen success state
- "+15 XP" text floats upward and fades
- Streak update message if applicable
- "Back to Monk Mode" dismisses modal

**Timer implementation:**
- Use `setInterval` with `useRef` for the interval handle
- Store `startTimestamp` in a ref — compute elapsed as `Date.now() - startTimestamp` to avoid drift
- Minimum session for XP: 5 minutes
- On complete: call `completeSession()`, dispatch `addXPGain()` to store, check level-up

---

## 10. Weekly Flight Log Modal — `app/modals/flight-log.tsx`

Full-screen modal. 7 sequential screens. Forward-only navigation.

Load all data before opening via `getFlightLogData()`. Show a loading state if data is not ready.

Progress indicator: 7 dots at top, current dot filled with `Colors.pilot.primary`.

### Screen 1 — Altitude check
- Large animated score (0 → actual, counting up over 1.5s)
- Colour: `Colors.danger` if < 40, `Colors.warning` if 40–70, `Colors.success` if > 70
- Score breakdown: habit %, tasks completed, XP earned this week
- Non-judgmental framing at all scores

### Screen 2 — Flight path
- Active goals with mini progress bars showing this week's contribution

### Screen 3 — Turbulence
- Missed habits listed as cards — name, streak impact, days missed
- Framing: "opportunity zones for next week"
- If nothing missed: "Clean flight. Zero turbulence."

### Screen 4 — Best moment
- Large open text input
- Placeholder: "Even small wins count."
- Required (min 3 chars)

### Screen 5 — Streak report
- All active habit streaks with `StreakFlame` components
- Overall Zenflo streak prominently displayed
- Freeze token count per habit

### Screen 6 — Course correction
- Open text input
- Placeholder: "What will you do differently?"
- Required

### Screen 7 — Clearance granted
- Full-screen celebration
- "Clearance granted. Your flight log is sealed."
- "+30 XP" float animation
- Level-up overlay if applicable
- Badge unlock if "Pilot certified" earned (10 logs)
- "Begin next week" CTA — calls `submitFlightLog()` then dismisses

---

## 11. Core UI Components

All in `src/components/`. All use theme tokens. All handle loading/empty states.

### `ProgressRing`
SVG circular ring. Props: `size`, `progress` (0–1), `color`, `strokeWidth`, `children`.
Animate progress changes with `react-native-reanimated` `useAnimatedProps`.

### `StreakFlame`
Props: `count`, `size: 'sm' | 'md' | 'lg'`, `frozen?: boolean`.
- count = 0: grey, "Start today"
- 1–6: orange, small
- 7–29: orange with glow
- 30+: gold, large

### `XPBar`
Horizontal progress bar. Props: `currentXP`, `totalXP`.
Level name left, XP fraction right. Fills in `Colors.xp`. Animates on XP gain.

### `HabitCard`
Props: `habit`, `isCompletedToday`, `onComplete`.
- `Colors.background.secondary` card, `Radius.lg` corners
- XP weight badge top-right (1x grey / 2x muted orange / 3x orange)
- Streak number + flame right side
- Completed state: green tint + checkmark
- Tap: scale pulse animation + `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)` + call `onComplete`
- Show "+X XP" float animation on completion (absolute positioned, animates upward 40px, fades out)

### `Button`
Props: `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`, `label`, `onPress`, `disabled?`, `loading?`, `icon?`.
All variants use theme tokens. Disabled state reduces opacity to 0.4.

### `Card`
Base wrapper. Props: `children`, `style?`, `onPress?`. `Colors.background.secondary`, `Radius.lg`, `Spacing.lg` padding.

---

## 12. Gamification Interactions

### Habit completion sequence
1. Scale animation: 1.0 → 1.08 → 1.0 (spring, 200ms)
2. Haptic: `ImpactFeedbackStyle.Heavy`
3. Optimistic UI update immediately
4. Call `completeHabit()` async
5. XP float: "+X XP" animates upward from card, fades out over 600ms
6. If milestone: toast/banner — "🔥 7-day streak! Bonus 50 XP"
7. If new record: "🏆 New record: X days!"
8. XP bar animates

### Level-up sequence
Triggered when `awardXP()` returns `leveledUp: true`:
1. Full-screen semi-transparent overlay fades in
2. Level name animates from scale 2.0 → 1.0
3. "You are now a [Level Name]" subtitle
4. Confetti burst via `react-native-confetti-cannon`
5. XP bar fills to 100%, then resets to new level start
6. `Haptics.notificationAsync(NotificationFeedbackType.Success)`
7. Auto-dismiss after 3 seconds or on tap

### XP sources reference

| Action | XP |
|---|---|
| Complete a habit | 10 × xp_weight |
| Complete a task | 5 |
| Complete a focus session (≥ 5 min) | 15 |
| 7-day streak | +50 bonus |
| 14-day streak | +30 bonus |
| 21-day streak | +50 bonus |
| 30-day streak | +75 bonus |
| 60-day streak | +100 bonus |
| 100-day streak | +200 bonus |
| Complete a goal | 200 |
| Submit Flight Log | 30 |

---

## 13. Notifications — `src/hooks/useNotifications.ts`

Schedule all notifications at onboarding completion. Respect user toggles from Settings.

```typescript
// Morning ritual — daily 8:00am
// Streak at risk — daily 9:00pm, conditional on incomplete habits
// Flight Log ready — every Sunday 9:00am
```

The streak-at-risk notification requires a background check using `expo-task-manager`. Register a background fetch task that:
1. Checks if today's habits are all completed
2. If not, triggers the "streak at risk" local notification
3. Runs at most once per day

---

## 14. Settings Screen — `app/settings.tsx`

Minimal. Sections:

1. **Profile** — Level name, total XP, member since date
2. **Notifications** — Toggle each type, set morning reminder time (time picker)
3. **Streak freeze** — Explanation card, token count per habit
4. **Data** — Export as JSON (`expo-sharing`), Clear all data (with two-step confirmation)
5. **About** — App version, "Zenflo is and will always be free."

---

## 15. Performance Requirements

| Metric | Target |
|---|---|
| Cold launch to first interactive screen | < 1.5s |
| Tab switch including animation | < 300ms |
| Habit completion to visual feedback | < 50ms (optimistic) |
| Home screen DB read | < 100ms |
| Focus timer accuracy over 90 min | ± 1 second |
| Any single SQLite query | < 20ms |

**Optimistic UI rule:** Habit and task completions must update the UI before the DB write confirms. Roll back on failure with a brief error toast.

**Data loading pattern:** Load from store first (instant), refresh from DB in background, update store if data changed. Never block UI on a DB read.

---

## 16. Error Handling

- Wrap root layout in an `ErrorBoundary` component
- On unhandled error: log to AsyncStorage, show recovery screen, offer "Restart" via `expo-updates`
- All DB functions wrapped in try/catch — return safe defaults (empty array, null, 0)
- Every list component must have a designed empty state

**Empty states:**
- Habits grid: "Add your first habit. It earns you XP every day."
- Goals list: "A goal gives your habits direction. Add one."
- Tasks list: "Nothing to do today. Enjoy the space."
- Flight log history: "Complete your first Sunday review to see your history here."

---

## 17. Badge Definitions — `src/constants/badges.ts`

```typescript
export const BADGES = [
  { id: 'first_session',   name: 'First session',    description: 'Complete your first focus session',         icon: '🧘' },
  { id: 'week_flame',      name: '7-day flame',       description: 'Maintain a 7-day overall streak',           icon: '🔥' },
  { id: 'monk',            name: 'Monk',              description: 'Complete 30 consecutive focus sessions',     icon: '🌙' },
  { id: 'ironstreak',      name: 'Ironstreak',        description: 'Reach a 30-day overall streak',             icon: '⚡' },
  { id: 'first_goal',      name: 'Navigator',         description: 'Complete your first goal',                  icon: '🎯' },
  { id: 'pilot_certified', name: 'Pilot certified',   description: 'Complete 10 weekly Flight Logs',            icon: '🛩️' },
  { id: 'centurion',       name: 'Centurion',         description: 'Reach a 100-day streak on any habit',       icon: '💯' },
  { id: 'xp_1000',         name: 'Momentum',          description: 'Earn 1,000 total XP',                       icon: '⚡' },
  { id: 'xp_10000',        name: 'Compounding',       description: 'Earn 10,000 total XP',                      icon: '🌟' },
  { id: 'zenmaster',       name: 'Zenmaster',         description: 'Reach Level 50',                            icon: '✨' },
  { id: 'habit_5',         name: 'Full stack',        description: 'Maintain 5 habits simultaneously',          icon: '🏗️' },
  { id: 'focus_10h',       name: 'Deep work',         description: 'Log 10 hours of total focus time',          icon: '⏱️' },
];
```

Badge unlock logic: check for each badge condition after every XP award, habit completion, session completion, and flight log submission. Call `unlockBadge(id)` which inserts into the `badges` table (idempotent) and triggers the badge unlock bottom sheet if it was newly earned.

---

## 18. Accountability Partner and Share Cards (v1 Stub)

### Share cards — `src/utils/shareCard.ts`
Implement using `react-native-view-shot` to capture a styled `View` and `expo-sharing` to share it.

Two card types:
1. **Flight Log summary card** — altitude score, streak, best moment quote, Zenflo branding
2. **Streak milestone card** — generated at 7 / 30 / 60 / 100 days, habit name, streak count, Zenflo branding

Both cards should be designed as a styled React Native `View` that gets captured as an image. Use `Colors.background.primary` as the card background, `Colors.accent` as the accent, and include the Zenflo wordmark.

### Accountability partner
Schema is in place (stubbed). Settings section shows "Accountability partner — coming soon."

---

## 19. Pre-Launch Checklist

### Functionality
- [ ] Onboarding completes and persists all data to SQLite
- [ ] All three modes render with correct mode-specific styling
- [ ] Habits create, complete (idempotent), and archive correctly
- [ ] Streaks recalculate correctly across midnight
- [ ] Streak freeze: activates on missed day with tokens, resets on missed day without tokens
- [ ] XP awarded correctly for all 6 sources
- [ ] Level-up triggers, displays, and XP bar resets correctly
- [ ] Focus timer: starts, pauses, resumes, completes, handles early end
- [ ] Flight Log: only unlocks on Sunday, aggregates data, saves, awards XP, blocks duplicate submission
- [ ] Notifications schedule at onboarding end
- [ ] Settings data export produces valid JSON with all user data
- [ ] Settings data clear resets all SQLite tables and AsyncStorage

### Data integrity
- [ ] `completeHabit` twice on same day = same result, same XP (once)
- [ ] Deleting a goal does not delete linked habits or tasks — they become unlinked
- [ ] Max 5 active goals enforced in UI and DB
- [ ] Max 2 freeze tokens enforced in UI and DB

### Performance
- [ ] Cold launch < 1.5s on mid-range device
- [ ] Tab switches < 300ms
- [ ] Habit grid scrolls at 60fps
- [ ] Timer does not drift by > 1 second over 25 minutes

### Design
- [ ] Zero hardcoded colour values — all theme tokens
- [ ] All empty states implemented and styled
- [ ] All animations run at 60fps
- [ ] Haptic feedback on: habit complete, task complete, level up, badge unlock
- [ ] All interactive elements have `accessibilityLabel` and `accessibilityRole`

---

## 20. Build Order

Work strictly in this sequence:

| Phase | Day(s) | Work |
|---|---|---|
| 1 — Foundation | 1–2 | Bootstrap, theme, types, DB schema + singleton |
| 2 — Data layer | 3–4 | All DB query functions, streak + XP utils, stores, hooks |
| 3 — Onboarding | 5 | All 5 screens, data commit, first focus session |
| 4 — Mode screens | 6–8 | Monk, Athlete, Pilot screens; mode switcher + transition |
| 5 — Modals | 9–11 | Add Goal, Add Habit, Add Task, Focus Session, Flight Log |
| 6 — Gamification | 12–13 | Completion animations, level-up overlay, badge sheet, notifications |
| 7 — Polish | 14–15 | Settings, empty states, share cards, perf audit, error boundaries |

---

## 21. Hard Constraints

1. **Offline-only.** No network calls in v1. All features work with no internet.
2. **No accounts.** SQLite + AsyncStorage only.
3. **TypeScript strict mode.** Zero `any` types.
4. **Functional components only.** No class components.
5. **date-fns only.** No moment.js.
6. **Optimistic UI on all completions.** Never block on DB writes.
7. **Accessibility labels on all interactive elements.**
8. **Max 5 active goals** — enforced in UI and DB layer.
9. **Max 2 freeze tokens** — enforced in UI and DB layer.
10. **Onboarding not skippable.** At least one goal and one habit must exist before entering the main app.

---

*End of brief.*

*If in doubt: build the simplest correct version first, then layer polish. Correctness before aesthetics. Streaks before animations. Data integrity before design.*

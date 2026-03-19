export type Mode          = 'monk' | 'athlete' | 'pilot';
export type XPWeight      = 1 | 2 | 3;
export type GoalStatus    = 'active' | 'completed' | 'paused';
export type TaskPriority  = 'high' | 'medium' | 'low';
export type TaskStatus    = 'pending' | 'completed' | 'cancelled';
export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type Importance = 'high' | 'medium' | 'low';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  importance: Importance;
  targetDate?: string;
  status: GoalStatus;
  categoryId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  goalId?: string;
  title: string;
  frequency: HabitFrequency;
  customDays?: number[];
  xpWeight: XPWeight;
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  lastCompletedDate?: string;
  categoryId?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
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
  scheduledStart?: string;
  scheduledEnd?: string;
  calendarEventId?: string;
  isEvent: boolean;
  eventType?: string;
  categoryId?: string;
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
  weekStartDate: string;
  habitScore: number;
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
  userName?: string;
}

export interface Badge {
  id: string;
  unlockedAt: string;
}

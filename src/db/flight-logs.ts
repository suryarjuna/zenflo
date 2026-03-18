import { getDatabase, generateId } from './database';
import { nowISO, getWeekStart, isTodaySunday } from '../utils/dates';
import { awardXP } from './xp';
import type { FlightLog } from '../types';

function rowToFlightLog(row: Record<string, unknown>): FlightLog {
  return {
    id: row.id as string,
    weekStartDate: row.week_start_date as string,
    habitScore: row.habit_score as number,
    tasksCompleted: row.tasks_completed as number,
    xpEarned: row.xp_earned as number,
    longestStreak: row.longest_streak as number,
    bestMoment: row.best_moment as string,
    courseCorrection: row.course_correction as string,
    completedAt: row.completed_at as string,
  };
}

export async function canSubmitFlightLog(): Promise<boolean> {
  if (!isTodaySunday()) return false;
  const db = await getDatabase();
  const weekStart = getWeekStart();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM flight_logs WHERE week_start_date = ?',
    [weekStart]
  );
  return !existing;
}

export async function getFlightLogData(): Promise<{
  habitScore: number;
  tasksCompleted: number;
  xpEarned: number;
  longestStreak: number;
  missedHabits: { id: string; title: string; daysMissed: number; streakImpact: number }[];
  activeStreaks: { id: string; title: string; streak: number; freezeTokens: number }[];
}> {
  const db = await getDatabase();
  const weekStart = getWeekStart();

  // Habit score: completions this week / expected completions
  const habits = await db.getAllAsync<{
    id: string; title: string; frequency: string; current_streak: number; freeze_tokens: number;
  }>('SELECT id, title, frequency, current_streak, freeze_tokens FROM habits WHERE archived_at IS NULL');

  let totalExpected = 0;
  let totalCompleted = 0;
  const missedHabits: { id: string; title: string; daysMissed: number; streakImpact: number }[] = [];
  const activeStreaks: { id: string; title: string; streak: number; freezeTokens: number }[] = [];

  for (const habit of habits) {
    const expected = habit.frequency === 'weekdays' ? 5 : 7;
    totalExpected += expected;

    const completions = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM habit_completions
       WHERE habit_id = ? AND date >= ? AND date < date(?, '+7 days')`,
      [habit.id, weekStart, weekStart]
    );
    const count = completions?.count ?? 0;
    totalCompleted += count;

    if (count < expected) {
      missedHabits.push({
        id: habit.id,
        title: habit.title,
        daysMissed: expected - count,
        streakImpact: count === 0 ? -habit.current_streak : 0,
      });
    }

    activeStreaks.push({
      id: habit.id,
      title: habit.title,
      streak: habit.current_streak,
      freezeTokens: habit.freeze_tokens,
    });
  }

  const habitScore = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  // Tasks completed this week
  const tasksRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM tasks
     WHERE status = 'completed' AND date(completed_at) >= ? AND date(completed_at) < date(?, '+7 days')`,
    [weekStart, weekStart]
  );

  // XP earned this week
  const xpRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM xp_events
     WHERE date(created_at) >= ? AND date(created_at) < date(?, '+7 days')`,
    [weekStart, weekStart]
  );

  // Longest streak among all habits
  const streakRow = await db.getFirstAsync<{ max_streak: number }>(
    'SELECT COALESCE(MAX(current_streak), 0) as max_streak FROM habits WHERE archived_at IS NULL'
  );

  return {
    habitScore,
    tasksCompleted: tasksRow?.count ?? 0,
    xpEarned: xpRow?.total ?? 0,
    longestStreak: streakRow?.max_streak ?? 0,
    missedHabits,
    activeStreaks,
  };
}

export async function submitFlightLog(data: {
  bestMoment: string;
  courseCorrection: string;
}): Promise<FlightLog> {
  const db = await getDatabase();
  const weekStart = getWeekStart();

  // Check if already submitted
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM flight_logs WHERE week_start_date = ?',
    [weekStart]
  );
  if (existing) throw new Error('Flight log already submitted for this week');

  const flightData = await getFlightLogData();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO flight_logs (id, week_start_date, habit_score, tasks_completed, xp_earned, longest_streak, best_moment, course_correction, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, weekStart, flightData.habitScore, flightData.tasksCompleted,
      flightData.xpEarned, flightData.longestStreak,
      data.bestMoment, data.courseCorrection, now,
    ]
  );

  // Update flight logs count
  await db.runAsync(
    'UPDATE user_stats SET flight_logs_completed = flight_logs_completed + 1 WHERE id = 1'
  );

  // Award XP
  await awardXP('flight_log', id, 30);

  return {
    id,
    weekStartDate: weekStart,
    habitScore: flightData.habitScore,
    tasksCompleted: flightData.tasksCompleted,
    xpEarned: flightData.xpEarned,
    longestStreak: flightData.longestStreak,
    bestMoment: data.bestMoment,
    courseCorrection: data.courseCorrection,
    completedAt: now,
  };
}

export async function getAllFlightLogs(): Promise<FlightLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM flight_logs ORDER BY week_start_date DESC'
  );
  return rows.map(rowToFlightLog);
}

export async function getFlightLogByWeek(weekStart: string): Promise<FlightLog | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM flight_logs WHERE week_start_date = ?',
    [weekStart]
  );
  return row ? rowToFlightLog(row) : null;
}

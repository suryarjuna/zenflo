import { getDatabase, generateId } from './database';
import { calculateStreak, streakBonusXP, STREAK_MILESTONES } from '../utils/streaks';
import { nowISO, todayISO } from '../utils/dates';
import { awardXP } from './xp';
import type { Habit, HabitCompletion, HabitFrequency, XPWeight } from '../types';

interface CreateHabitInput {
  title: string;
  goalId?: string;
  frequency?: HabitFrequency;
  customDays?: number[];
  xpWeight?: XPWeight;
}

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    goalId: (row.goal_id as string) ?? undefined,
    title: row.title as string,
    frequency: (row.frequency as HabitFrequency) ?? 'daily',
    customDays: row.custom_days ? JSON.parse(row.custom_days as string) : undefined,
    xpWeight: (row.xp_weight as XPWeight) ?? 1,
    currentStreak: (row.current_streak as number) ?? 0,
    longestStreak: (row.longest_streak as number) ?? 0,
    freezeTokens: (row.freeze_tokens as number) ?? 1,
    lastCompletedDate: (row.last_completed_date as string) ?? undefined,
    createdAt: row.created_at as string,
    archivedAt: (row.archived_at as string) ?? undefined,
  };
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC'
  );
  return rows.map(rowToHabit);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM habits WHERE id = ?',
    [id]
  );
  return row ? rowToHabit(row) : null;
}

export async function createHabit(data: CreateHabitInput): Promise<Habit> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO habits (id, goal_id, title, frequency, custom_days, xp_weight, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.goalId ?? null,
      data.title,
      data.frequency ?? 'daily',
      data.customDays ? JSON.stringify(data.customDays) : null,
      data.xpWeight ?? 1,
      now,
    ]
  );
  return (await getHabitById(id))!;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
  if (updates.customDays !== undefined) { fields.push('custom_days = ?'); values.push(JSON.stringify(updates.customDays)); }
  if (updates.xpWeight !== undefined) { fields.push('xp_weight = ?'); values.push(updates.xpWeight); }
  if (updates.goalId !== undefined) { fields.push('goal_id = ?'); values.push(updates.goalId ?? null); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE habits SET archived_at = ? WHERE id = ?', [nowISO(), id]);
}

export async function completeHabit(
  habitId: string,
  date: string
): Promise<{
  xpEarned: number;
  newStreak: number;
  isNewRecord: boolean;
  milestoneReached: number | null;
}> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  // 1. Insert completion (idempotent)
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );

  if (existing) {
    // Already completed today - return current state
    const habit = await getHabitById(habitId);
    return {
      xpEarned: 0,
      newStreak: habit?.currentStreak ?? 0,
      isNewRecord: false,
      milestoneReached: null,
    };
  }

  await db.runAsync(
    'INSERT OR IGNORE INTO habit_completions (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)',
    [id, habitId, date, now]
  );

  // 2. Fetch all completion dates
  const completions = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
    [habitId]
  );
  const sortedDates = completions.map(c => c.date);

  // 3. Calculate streak
  const newStreak = calculateStreak(sortedDates);

  // 4. Get current habit data
  const habit = await db.getFirstAsync<{ longest_streak: number; xp_weight: number }>(
    'SELECT longest_streak, xp_weight FROM habits WHERE id = ?',
    [habitId]
  );

  const longestStreak = habit?.longest_streak ?? 0;
  const xpWeight = (habit?.xp_weight ?? 1) as XPWeight;
  const isNewRecord = newStreak > longestStreak;
  const newLongest = Math.max(newStreak, longestStreak);

  // 5. Update habit
  await db.runAsync(
    'UPDATE habits SET current_streak = ?, longest_streak = ?, last_completed_date = ? WHERE id = ?',
    [newStreak, newLongest, date, habitId]
  );

  // 6. Compute XP
  let xpEarned = 10 * xpWeight;

  // 7. Check milestone
  let milestoneReached: number | null = null;
  const bonus = streakBonusXP(newStreak);
  if (bonus > 0) {
    xpEarned += bonus;
    milestoneReached = newStreak;
  }

  // 8. Check freeze token earn (every 14 days)
  if (newStreak > 0 && newStreak % 14 === 0) {
    await earnFreezeToken(habitId);
  }

  // 9. Award XP
  await awardXP('habit', habitId, xpEarned);

  return { xpEarned, newStreak, isNewRecord, milestoneReached };
}

export async function getHabitCompletionsForDate(date: string): Promise<HabitCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; habit_id: string; date: string; completed_at: string;
  }>('SELECT * FROM habit_completions WHERE date = ?', [date]);
  return rows.map(r => ({
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    completedAt: r.completed_at,
  }));
}

export async function getHabitCompletionsForWeek(
  habitId: string,
  weekStart: string
): Promise<HabitCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; habit_id: string; date: string; completed_at: string;
  }>(
    `SELECT * FROM habit_completions
     WHERE habit_id = ? AND date >= ? AND date < date(?, '+7 days')
     ORDER BY date ASC`,
    [habitId, weekStart, weekStart]
  );
  return rows.map(r => ({
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    completedAt: r.completed_at,
  }));
}

export async function earnFreezeToken(habitId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE habits SET freeze_tokens = MIN(freeze_tokens + 1, 2) WHERE id = ?',
    [habitId]
  );
}

export async function consumeFreezeToken(habitId: string): Promise<boolean> {
  const db = await getDatabase();
  const habit = await db.getFirstAsync<{ freeze_tokens: number }>(
    'SELECT freeze_tokens FROM habits WHERE id = ?',
    [habitId]
  );
  if (!habit || habit.freeze_tokens <= 0) return false;
  await db.runAsync(
    'UPDATE habits SET freeze_tokens = freeze_tokens - 1 WHERE id = ?',
    [habitId]
  );
  return true;
}

import { getDatabase, generateId } from './database';
import { levelFromXP } from '../constants/levels';
import { nowISO } from '../utils/dates';
import type { XPEvent, UserStats } from '../types';

export async function awardXP(
  source: XPEvent['source'],
  sourceId: string | undefined,
  amount: number
): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    'INSERT INTO xp_events (id, source, source_id, amount, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, source, sourceId ?? null, amount, now]
  );

  await db.runAsync(
    'UPDATE user_stats SET total_xp = total_xp + ? WHERE id = 1',
    [amount]
  );

  const row = await db.getFirstAsync<{ total_xp: number; level: number }>(
    'SELECT total_xp, level FROM user_stats WHERE id = 1'
  );

  const newTotal = row?.total_xp ?? 0;
  const newLevel = levelFromXP(newTotal);
  const oldLevel = row?.level ?? 1;
  const leveledUp = newLevel > oldLevel;

  if (leveledUp) {
    await db.runAsync('UPDATE user_stats SET level = ? WHERE id = 1', [newLevel]);
  }

  return { newTotal, leveledUp, newLevel };
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    total_xp: number;
    level: number;
    overall_streak: number;
    longest_overall_streak: number;
    total_focus_minutes: number;
    flight_logs_completed: number;
    last_active_date: string;
    onboarding_complete: number;
    user_name: string | null;
  }>('SELECT * FROM user_stats WHERE id = 1');

  if (!row) {
    return {
      totalXP: 0,
      level: 1,
      overallStreak: 0,
      longestOverallStreak: 0,
      totalFocusMinutes: 0,
      flightLogsCompleted: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      onboardingComplete: false,
    };
  }

  return {
    totalXP: row.total_xp,
    level: row.level,
    overallStreak: row.overall_streak,
    longestOverallStreak: row.longest_overall_streak,
    totalFocusMinutes: row.total_focus_minutes,
    flightLogsCompleted: row.flight_logs_completed,
    lastActiveDate: row.last_active_date,
    onboardingComplete: row.onboarding_complete === 1,
    userName: row.user_name ?? undefined,
  };
}

export async function getXPEvents(limit: number = 50): Promise<XPEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    source: string;
    source_id: string | null;
    amount: number;
    created_at: string;
  }>('SELECT * FROM xp_events ORDER BY created_at DESC LIMIT ?', [limit]);

  return rows.map(r => ({
    id: r.id,
    source: r.source as XPEvent['source'],
    sourceId: r.source_id ?? undefined,
    amount: r.amount,
    createdAt: r.created_at,
  }));
}

export async function setOnboardingComplete(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE user_stats SET onboarding_complete = 1 WHERE id = 1');
}

export async function setUserName(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE user_stats SET user_name = ? WHERE id = 1', [name]);
}

export async function unlockBadge(badgeId: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM badges WHERE id = ?',
    [badgeId]
  );
  if (existing) return false;
  await db.runAsync(
    'INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?, ?)',
    [badgeId, nowISO()]
  );
  return true;
}

export async function getUnlockedBadges(): Promise<{ id: string; unlockedAt: string }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; unlocked_at: string }>(
    'SELECT * FROM badges ORDER BY unlocked_at DESC'
  );
  return rows.map(r => ({ id: r.id, unlockedAt: r.unlocked_at }));
}

import { getDatabase, generateId } from './database';
import { nowISO, todayISO } from '../utils/dates';
import { awardXP } from './xp';
import type { FocusSession } from '../types';

function rowToSession(row: Record<string, unknown>): FocusSession {
  return {
    id: row.id as string,
    taskId: (row.task_id as string) ?? undefined,
    durationMinutes: row.duration_minutes as number,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
    wasInterrupted: (row.was_interrupted as number) === 1,
  };
}

export async function startSession(data: {
  durationMinutes: number;
  taskId?: string;
}): Promise<FocusSession> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    'INSERT INTO focus_sessions (id, task_id, duration_minutes, started_at) VALUES (?, ?, ?, ?)',
    [id, data.taskId ?? null, data.durationMinutes, now]
  );

  return {
    id,
    taskId: data.taskId,
    durationMinutes: data.durationMinutes,
    startedAt: now,
    wasInterrupted: false,
  };
}

export async function completeSession(
  id: string,
  actualMinutes: number,
  wasInterrupted: boolean = false
): Promise<{ xpEarned: number }> {
  const db = await getDatabase();
  const now = nowISO();

  await db.runAsync(
    'UPDATE focus_sessions SET completed_at = ?, duration_minutes = ?, was_interrupted = ? WHERE id = ?',
    [now, actualMinutes, wasInterrupted ? 1 : 0, id]
  );

  // Update total focus minutes
  await db.runAsync(
    'UPDATE user_stats SET total_focus_minutes = total_focus_minutes + ? WHERE id = 1',
    [actualMinutes]
  );

  // Award XP if >= 5 minutes
  let xpEarned = 0;
  if (actualMinutes >= 5) {
    xpEarned = 15;
    await awardXP('session', id, xpEarned);
  }

  return { xpEarned };
}

export async function getSessionsForDate(date?: string): Promise<FocusSession[]> {
  const db = await getDatabase();
  const targetDate = date ?? todayISO();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM focus_sessions WHERE date(started_at) = ? ORDER BY started_at DESC",
    [targetDate]
  );
  return rows.map(rowToSession);
}

export async function getTotalFocusMinutes(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_minutes), 0) as total FROM focus_sessions WHERE completed_at IS NOT NULL'
  );
  return row?.total ?? 0;
}

export async function getSessionCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM focus_sessions WHERE completed_at IS NOT NULL'
  );
  return row?.count ?? 0;
}

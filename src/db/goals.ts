import { getDatabase, generateId } from './database';
import { nowISO } from '../utils/dates';
import { awardXP } from './xp';
import type { Goal, GoalStatus } from '../types';

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    targetDate: (row.target_date as string) ?? undefined,
    status: (row.status as GoalStatus) ?? 'active',
    importance: (row.importance as 'high' | 'medium' | 'low') ?? 'medium',
    categoryId: (row.category_id as string) ?? undefined,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  };
}

export async function getAllActiveGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM goals WHERE status = 'active' ORDER BY created_at ASC"
  );
  return rows.map(rowToGoal);
}

export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM goals ORDER BY created_at DESC'
  );
  return rows.map(rowToGoal);
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM goals WHERE id = ?',
    [id]
  );
  return row ? rowToGoal(row) : null;
}

export async function createGoal(data: {
  title: string;
  description?: string;
  targetDate?: string;
  importance?: 'high' | 'medium' | 'low';
  categoryId?: string;
}): Promise<Goal> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  // Enforce max 5 active goals
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM goals WHERE status = 'active'"
  );
  if (count && count.count >= 5) {
    throw new Error('Maximum 5 active goals allowed');
  }

  await db.runAsync(
    'INSERT INTO goals (id, title, description, target_date, status, importance, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, data.title, data.description ?? '', data.targetDate ?? null, 'active', data.importance ?? 'medium', data.categoryId ?? null, now]
  );
  return (await getGoalById(id))!;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.targetDate !== undefined) { fields.push('target_date = ?'); values.push(updates.targetDate ?? null); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.importance !== undefined) { fields.push('importance = ?'); values.push(updates.importance); }
  if (updates.categoryId !== undefined) { fields.push('category_id = ?'); values.push(updates.categoryId ?? null); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function completeGoal(id: string): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  await db.runAsync(
    "UPDATE goals SET status = 'completed', completed_at = ? WHERE id = ?",
    [now, id]
  );
  const goal = await getGoalById(id);
  const xpMap = { high: 300, medium: 200, low: 100 };
  const xp = xpMap[goal?.importance ?? 'medium'];
  await awardXP('goal_complete', id, xp);
}

export async function getGoalProgress(goalId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalHabits: number;
  percent: number;
}> {
  const db = await getDatabase();
  const total = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tasks WHERE goal_id = ?',
    [goalId]
  );
  const completed = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM tasks WHERE goal_id = ? AND status = 'completed'",
    [goalId]
  );
  const habits = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM habits WHERE goal_id = ? AND archived_at IS NULL',
    [goalId]
  );

  const totalCount = total?.count ?? 0;
  const completedCount = completed?.count ?? 0;

  return {
    totalTasks: totalCount,
    completedTasks: completedCount,
    totalHabits: habits?.count ?? 0,
    percent: totalCount > 0 ? completedCount / totalCount : 0,
  };
}

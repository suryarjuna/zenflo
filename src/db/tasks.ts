import { getDatabase, generateId } from './database';
import { nowISO, todayISO } from '../utils/dates';
import { awardXP } from './xp';
import type { Task, TaskPriority, TaskStatus } from '../types';

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    goalId: (row.goal_id as string) ?? undefined,
    title: row.title as string,
    dueDate: (row.due_date as string) ?? undefined,
    priority: (row.priority as TaskPriority) ?? 'medium',
    status: (row.status as TaskStatus) ?? 'pending',
    isRecurring: (row.is_recurring as number) === 1,
    recurringInterval: (row.recurring_interval as Task['recurringInterval']) ?? undefined,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
    scheduledStart: (row.scheduled_start as string) ?? undefined,
    scheduledEnd: (row.scheduled_end as string) ?? undefined,
    calendarEventId: (row.calendar_event_id as string) ?? undefined,
    isEvent: (row.is_event as number) === 1,
    eventType: (row.event_type as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
  };
}

export async function getTasksForToday(): Promise<Task[]> {
  const db = await getDatabase();
  const today = todayISO();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE status = 'pending'
     AND (due_date IS NULL OR due_date <= ?)
     AND is_event = 0
     ORDER BY
       CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
       created_at ASC`,
    [today]
  );
  return rows.map(rowToTask);
}

export async function getAllPendingTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE status = 'pending'
     ORDER BY
       CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
       due_date ASC NULLS LAST,
       created_at ASC`
  );
  return rows.map(rowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE id = ?',
    [id]
  );
  return row ? rowToTask(row) : null;
}

export async function createTask(data: {
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
  categoryId?: string;
}): Promise<Task> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO tasks (id, goal_id, title, due_date, priority, is_recurring, recurring_interval, scheduled_start, scheduled_end, calendar_event_id, is_event, event_type, category_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.goalId ?? null,
      data.title,
      data.dueDate ?? null,
      data.priority ?? 'medium',
      data.isRecurring ? 1 : 0,
      data.recurringInterval ?? null,
      data.scheduledStart ?? null,
      data.scheduledEnd ?? null,
      data.calendarEventId ?? null,
      data.isEvent ? 1 : 0,
      data.eventType ?? null,
      data.categoryId ?? null,
      now,
    ]
  );
  return (await getTaskById(id))!;
}

export async function completeTask(id: string): Promise<void> {
  const db = await getDatabase();
  const now = nowISO();
  const task = await getTaskById(id);
  if (!task) return;

  await db.runAsync(
    "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
    [now, id]
  );

  const xpMap: Record<string, number> = { high: 10, medium: 5, low: 3 };
  const xp = xpMap[task.priority] ?? 5;
  await awardXP('task', id, xp);

  // Handle recurring task reset
  if (task.isRecurring && task.recurringInterval) {
    const nextId = generateId();
    let nextDue: string | null = null;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      switch (task.recurringInterval) {
        case 'daily': dueDate.setDate(dueDate.getDate() + 1); break;
        case 'weekly': dueDate.setDate(dueDate.getDate() + 7); break;
        case 'monthly': dueDate.setMonth(dueDate.getMonth() + 1); break;
      }
      nextDue = dueDate.toISOString().split('T')[0];
    }

    await db.runAsync(
      `INSERT INTO tasks (id, goal_id, title, due_date, priority, is_recurring, recurring_interval, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextId, task.goalId ?? null, task.title, nextDue, task.priority, 1, task.recurringInterval, now]
    );
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate ?? null); }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
  if (updates.goalId !== undefined) { fields.push('goal_id = ?'); values.push(updates.goalId ?? null); }
  if (updates.categoryId !== undefined) { fields.push('category_id = ?'); values.push(updates.categoryId ?? null); }

  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE tasks SET status = 'cancelled' WHERE id = ?", [id]);
}

export async function getTasksByGoal(goalId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM tasks WHERE goal_id = ? AND status = 'pending' ORDER BY created_at ASC",
    [goalId]
  );
  return rows.map(rowToTask);
}

export async function getEventsForDate(date: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM tasks WHERE is_event = 1 AND (due_date = ? OR scheduled_start LIKE ?) ORDER BY scheduled_start ASC",
    [date, `${date}%`]
  );
  return rows.map(rowToTask);
}

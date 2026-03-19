import { getDatabase, generateId } from './database';
import { nowISO } from '../utils/dates';
import type { Category } from '../types';

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    icon: (row.icon as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM categories ORDER BY created_at ASC'
  );
  return rows.map(rowToCategory);
}

export async function createCategory(data: { name: string; color: string; icon?: string }): Promise<Category> {
  const db = await getDatabase();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    'INSERT INTO categories (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.color, data.icon ?? null, now]
  );
  return { id, name: data.name, color: data.color, icon: data.icon, createdAt: now };
}

export async function updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon ?? null); }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

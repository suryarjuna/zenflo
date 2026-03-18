import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, SCHEMA_VERSION, MIGRATIONS } from './schema';

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
  } else {
    await runMigrations(_db);
  }
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );
  const currentVersion = row?.version ?? 1;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      const statements = migration.sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of statements) {
        await db.runAsync(stmt);
      }
      await db.runAsync('UPDATE schema_version SET version = ?', [migration.version]);
    }
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

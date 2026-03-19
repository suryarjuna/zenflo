export const SCHEMA_VERSION = 4;

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
    user_name TEXT,
    selected_mode TEXT NOT NULL DEFAULT 'monk',
    onboarding_complete INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    importance TEXT NOT NULL DEFAULT 'medium',
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
    scheduled_start TEXT,
    scheduled_end TEXT,
    calendar_event_id TEXT,
    is_event INTEGER NOT NULL DEFAULT 0,
    event_type TEXT,
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

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#E8853D',
    icon TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    unlocked_at TEXT NOT NULL
  );

  INSERT OR IGNORE INTO user_stats (id, last_active_date)
  VALUES (1, date('now'));
`;

export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 2,
    sql: `
      ALTER TABLE goals ADD COLUMN importance TEXT NOT NULL DEFAULT 'medium';
      ALTER TABLE user_stats ADD COLUMN user_name TEXT;
      ALTER TABLE user_stats ADD COLUMN selected_mode TEXT NOT NULL DEFAULT 'monk';
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE tasks ADD COLUMN scheduled_start TEXT;
      ALTER TABLE tasks ADD COLUMN scheduled_end TEXT;
      ALTER TABLE tasks ADD COLUMN calendar_event_id TEXT;
      ALTER TABLE tasks ADD COLUMN is_event INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE tasks ADD COLUMN event_type TEXT;
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#E8853D',
        icon TEXT,
        created_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO categories (id, name, color, icon, created_at) VALUES ('cat_work', 'Work', '#60A5FA', 'briefcase-outline', datetime('now'));
      INSERT OR IGNORE INTO categories (id, name, color, icon, created_at) VALUES ('cat_health', 'Health', '#22C55E', 'heart-outline', datetime('now'));
      INSERT OR IGNORE INTO categories (id, name, color, icon, created_at) VALUES ('cat_personal', 'Personal', '#A78BFA', 'person-outline', datetime('now'));
      INSERT OR IGNORE INTO categories (id, name, color, icon, created_at) VALUES ('cat_hobby', 'Hobby', '#F97316', 'color-palette-outline', datetime('now'));
      ALTER TABLE tasks ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;
      ALTER TABLE habits ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;
      ALTER TABLE goals ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;
    `,
  },
];

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'learning.db');

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Создаем таблицы если их нет
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    leader_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leader_id INTEGER,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT DEFAULT '',
    description TEXT DEFAULT '',
    quiz_data TEXT DEFAULT '',
    homework_data TEXT DEFAULT '',
    block_id INTEGER,
    module_id INTEGER,
    order_index INTEGER NOT NULL DEFAULT 1,
    leader_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS quiz_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    free_answer TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

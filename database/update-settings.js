const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');
const db = new Database(dbPath);

// Создаем таблицу настроек для каждого лидера
db.exec(`
  CREATE TABLE IF NOT EXISTS leader_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leader_id INTEGER NOT NULL,
    block1_name TEXT DEFAULT 'Блок 1',
    block2_name TEXT DEFAULT 'Блок 2',
    module1_name TEXT DEFAULT 'Модуль 1',
    module2_name TEXT DEFAULT 'Модуль 2',
    lesson_name TEXT DEFAULT 'Урок',
    FOREIGN KEY (leader_id) REFERENCES users(id),
    UNIQUE(leader_id)
  );
`);

console.log('✅ Таблица настроек создана!');
db.close();

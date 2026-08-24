const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');
const db = new Database(dbPath);

// Создаем таблицу блоков
db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leader_id INTEGER,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (leader_id) REFERENCES users(id)
  );
`);

// Создаем таблицу модулей
db.exec(`
  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (block_id) REFERENCES blocks(id)
  );
`);

// Добавляем module_id в lessons если нет
try {
  db.exec("ALTER TABLE lessons ADD COLUMN module_id INTEGER REFERENCES modules(id)");
  console.log('✅ module_id добавлен в lessons');
} catch (e) {
  console.log('module_id уже существует');
}

// Добавляем block_id в lessons если нет
try {
  db.exec("ALTER TABLE lessons ADD COLUMN block_id INTEGER REFERENCES blocks(id)");
  console.log('✅ block_id добавлен в lessons');
} catch (e) {
  console.log('block_id уже существует');
}

console.log('✅ Структура обновлена!');
db.close();

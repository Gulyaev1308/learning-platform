const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');
const db = new Database(dbPath);

// Добавляем колонку leader_id в таблицу lessons (если нет)
try {
  db.exec("ALTER TABLE lessons ADD COLUMN leader_id INTEGER REFERENCES users(id)");
  console.log('✅ Колонка leader_id добавлена в lessons');
} catch (e) {
  console.log('Колонка leader_id уже существует');
}

// Добавляем колонку description в таблицу lessons (если нет)
try {
  db.exec("ALTER TABLE lessons ADD COLUMN description TEXT DEFAULT ''");
  console.log('✅ Колонка description добавлена в lessons');
} catch (e) {
  console.log('Колонка description уже существует');
}

// Добавляем колонку title в таблицу users для кастомизации (если нет)
try {
  db.exec("ALTER TABLE users ADD COLUMN custom_title TEXT DEFAULT ''");
  console.log('✅ Колонка custom_title добавлена в users');
} catch (e) {
  console.log('Колонка custom_title уже существует');
}

db.close();
console.log('✅ Обновление схемы завершено!');

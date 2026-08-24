const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');
const db = new Database(dbPath);

const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Администратор';

// Проверяем, существует ли админ
const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');

if (existingAdmin) {
  console.log('❌ Админ уже существует');
  console.log(`ID: ${existingAdmin.id}`);
  console.log('Используйте существующего админа или удалите его из БД');
  db.close();
  process.exit(1);
}

// Создаем админа
const passwordHash = bcrypt.hashSync(password, 10);

const result = db.prepare(
  'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
).run(email, passwordHash, name, 'admin');

console.log('✅ Админ создан!');
console.log(`Email: ${email}`);
console.log(`Пароль: ${password}`);
console.log(`Имя: ${name}`);
console.log(`ID: ${result.lastInsertRowid}`);

db.close();

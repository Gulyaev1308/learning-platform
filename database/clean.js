const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');
const db = new Database(dbPath);

console.log('=== Очистка базы данных ===');

// Очищаем таблицы
db.exec('DELETE FROM quiz_answers');
console.log('✅ quiz_answers очищены');

db.exec('DELETE FROM progress');
console.log('✅ progress очищен');

db.exec('DELETE FROM lessons');
console.log('✅ lessons очищены');

db.exec('DELETE FROM modules');
console.log('✅ modules очищены');

db.exec('DELETE FROM blocks');
console.log('✅ blocks очищены');

// Сбрасываем автоинкремент
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('lessons', 'modules', 'blocks', 'quiz_answers', 'progress')");
console.log('✅ Автоинкремент сброшен');

// Оставляем пользователей (лидеры, ученики, админ)
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`✅ Пользователи сохранены: ${usersCount.count}`);

console.log('');
console.log('=== Готово! База очищена ===');
console.log('Блоки, модули, уроки удалены.');
console.log('Пользователи сохранены.');

db.close();

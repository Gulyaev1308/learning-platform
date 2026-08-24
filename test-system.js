const Database = require('better-sqlite3');
const db = new Database('database/learning.db');

console.log('=== 🧪 АВТОМАТИЧЕСКОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ ===\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
}

// 1. Проверка пользователей
const users = db.prepare('SELECT * FROM users').all();
test('Пользователи существуют', users.length > 0);
test('Есть администратор', users.some(u => u.role === 'admin'));
test('Есть лидер', users.some(u => u.role === 'leader'));
test('Есть ученик', users.some(u => u.role === 'student'));

// 2. Проверка структуры
const blocks = db.prepare('SELECT * FROM blocks').all();
test('Блоки существуют', blocks.length > 0);

const modules = db.prepare('SELECT * FROM modules').all();
test('Модули существуют', modules.length > 0);

const lessons = db.prepare('SELECT * FROM lessons').all();
test('Уроки существуют', lessons.length > 0);

// 3. Проверка связи блок → модуль
for (const block of blocks) {
  const blockModules = modules.filter(m => m.block_id === block.id);
  test(`Блок "${block.title}" имеет модули`, blockModules.length > 0);
}

// 4. Проверка связи модуль → урок
for (const mod of modules) {
  const modLessons = lessons.filter(l => l.module_id === mod.id);
  test(`Модуль "${mod.title}" имеет уроки`, modLessons.length > 0);
}

// 5. Проверка типов уроков
const validTypes = ['video', 'text'];
for (const lesson of lessons) {
  test(`Урок "${lesson.title}" имеет правильный тип`, validTypes.includes(lesson.type));
}

// 6. Проверка опросов и заданий
for (const lesson of lessons) {
  if (lesson.quiz_data) {
    try {
      const quiz = JSON.parse(lesson.quiz_data);
      test(`Опрос в "${lesson.title}" валиден`, Array.isArray(quiz) && quiz.length > 0);
    } catch {
      test(`Опрос в "${lesson.title}" валиден`, false);
    }
  }
}

// 7. Проверка прогресса
const progress = db.prepare('SELECT * FROM progress').all();
test('Таблица прогресса работает', progress.length >= 0);

// 8. Проверка quiz_answers
const quizAnswers = db.prepare('SELECT * FROM quiz_answers').all();
test('Таблица ответов работает', quizAnswers.length >= 0);

console.log('\n=== 📊 РЕЗУЛЬТАТЫ ===');
console.log(`✅ Пройдено: ${passed}`);
console.log(`❌ Провалено: ${failed}`);
console.log(`Всего тестов: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
} else {
  console.log('\n⚠️ ЕСТЬ ПРОБЛЕМЫ!');
}

db.close();

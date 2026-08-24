const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'database', 'learning.db');

// Проверяем, существует ли база данных
if (!fs.existsSync(dbPath)) {
  console.error('❌ База данных не найдена. Запустите сначала npm run db:init');
  process.exit(1);
}

const db = new Database(dbPath);

// Очистка таблиц
db.exec('DELETE FROM quiz_answers');
db.exec('DELETE FROM progress');
db.exec('DELETE FROM lessons');
db.exec('DELETE FROM users');

// Создание лидера
const leaderPassword = bcrypt.hashSync('leader123', 10);
const leaderResult = db.prepare(
  'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
).run('leader@example.com', leaderPassword, 'Лидер', 'leader');

const leaderId = leaderResult.lastInsertRowid;

console.log('✅ Лидер создан:', leaderId);

// Создание ученика
const studentPassword = bcrypt.hashSync('student123', 10);
const studentResult = db.prepare(
  'INSERT INTO users (email, password_hash, name, role, leader_id) VALUES (?, ?, ?, ?, ?)'
).run('student@example.com', studentPassword, 'Ученик', 'student', leaderId);

const studentId = studentResult.lastInsertRowid;

console.log('✅ Ученик создан:', studentId);

// Создание уроков
const lessons = [
  {
    title: 'Введение в курс',
    type: 'video',
    content: '/videos/intro.mp4',
    block: 1,
    module: 1,
    order_index: 1,
  },
  {
    title: 'Основные понятия',
    type: 'text',
    content: 'В этом уроке мы рассмотрим основные понятия...',
    block: 1,
    module: 1,
    order_index: 2,
  },
  {
    title: 'Проверка знаний',
    type: 'quiz',
    content: JSON.stringify({
      question: 'Что такое MLM?',
      options: [
        'Многоуровневый маркетинг',
        'Мобильная локальная сеть',
        'Метод линейного мышления',
        'Международная логистическая модель',
      ],
      correctAnswer: 0,
    }),
    block: 1,
    module: 1,
    order_index: 3,
  },
  {
    title: 'Практическое задание',
    type: 'practice',
    content: 'Напишите наставнику в Telegram о своих целях',
    block: 1,
    module: 2,
    order_index: 4,
  },
  {
    title: 'Продвинутые стратегии',
    type: 'video',
    content: '/videos/advanced.mp4',
    block: 2,
    module: null,
    order_index: 5,
  },
  {
    title: 'Работа с командой',
    type: 'text',
    content: 'Как эффективно управлять командой...',
    block: 2,
    module: null,
    order_index: 6,
  },
  {
    title: 'Итоговый опрос',
    type: 'quiz',
    content: JSON.stringify({
      question: 'Какая стратегия наиболее эффективна?',
      options: [
        'Работа в одиночку',
        'Построение команды',
        'Пассивное ожидание',
        'Агрессивные продажи',
      ],
      correctAnswer: 1,
    }),
    block: 2,
    module: null,
    order_index: 7,
  },
];

const insertLesson = db.prepare(
  'INSERT INTO lessons (title, type, content, block, module, order_index) VALUES (?, ?, ?, ?, ?, ?)'
);

for (const lesson of lessons) {
  insertLesson.run(
    lesson.title,
    lesson.type,
    lesson.content,
    lesson.block,
    lesson.module,
    lesson.order_index
  );
}

console.log('✅ Уроки созданы:', lessons.length);

console.log('');
console.log('=== Данные для входа ===');
console.log('Лидер: leader@example.com / leader123');
console.log('Ученик: student@example.com / student123');
console.log('');
console.log('✅ База данных заполнена!');

db.close();

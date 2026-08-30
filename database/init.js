const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Защита от зависания в Docker

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  console.log('=== Инициализация базы данных PostgreSQL (Релиз MVP) ===');
  try {
    // Включаем расширение для поддержки JSONB операций, если нужно
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await pool.query(`
      -- 1. ПОЛЬЗОВАТЕЛИ
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'leader', 'student')),
        leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ref_code VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. ДИНАМИЧЕСКИЕ БЛОКИ (Управляет Админ)
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 1,
        is_premium BOOLEAN DEFAULT FALSE, -- Флаг платного блока для MVP
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. ДИНАМИЧЕСКИЕ МОДУЛИ
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. УРОКИ (Со встроенным конструктором опросов)
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK(type IN ('video', 'text', 'quiz', 'practice')),
        content TEXT, -- Путь к видеофайлу плеера (lesson1.mp4) или текст
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 1,
        quiz_data JSONB DEFAULT '[]'::jsonb, -- Конструктор опросов (Админ пишет вопросы)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. ПРОГРЕСС ОБУЧЕНИЯ (Лестница и Прогрессбар)
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress')),
        video_last_position INTEGER DEFAULT 0, -- Секунда остановки видео для новичка
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );

      -- 6. ОТВЕТЫ НА ОПРОСЫ (Для CRM-карточки лидера)
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Хранит массив ответов
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );

      -- 7. ДОСТУП К ПЛАТНЫМ БЛОКАМ (Переводы на карту)
      CREATE TABLE IF NOT EXISTS premium_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Какой лидер подтвердил
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, block_id)
      );

      -- ИНДЕКСЫ ДЛЯ БЫСТРОЙ РАБОТЫ И СКОРОСТИ
      CREATE INDEX IF NOT EXISTS idx_users_leader ON users(leader_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(order_index);
      CREATE INDEX IF NOT EXISTS idx_modules_block ON modules(block_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
      CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_answers(user_id);
    `);
    console.log('✅ Все таблицы, связи и индексы под MVP успешно созданы!');

    // СИДИНГ ЭТАЛОННЫХ ПОЛЬЗОВАТЕЛЕЙ ДЛЯ ЗАВТРАШНЕГО СТАРТА
    const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@test.ru'");
    if (adminCheck.rows.length === 0) {
      console.log('=== Заполнение эталонных профилей ===');
      const salt = await bcrypt.genSalt(10);
      
      const adminHash = await bcrypt.hash('admin123', salt);
      const leaderHash = await bcrypt.hash('leader123', salt);
      const studentHash = await bcrypt.hash('student123', salt);

      // 1. Создаем вашего Главного Админа
      await pool.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@test.ru', $1, 'Главный Админ', 'admin')",
        [adminHash]
      );

      // 2. Создаем первого Лидера
      const leaderRes = await pool.query(
        "INSERT INTO users (email, password_hash, name, role, ref_code) VALUES ('leader@test.ru', $1, 'Лидер Siberian Wellness', 'leader', 'sw-leader') RETURNING id",
        [leaderHash]
      );
      const leaderId = leaderRes.rows[0].id;

      // 3. Создаем тестового Новичка, привязанного к Лидеру
      await pool.query(
        "INSERT INTO users (email, password_hash, name, role, leader_id) VALUES ('student@test.ru', $1, 'Новичок Сетевого', 'student', $2)",
        [studentHash, leaderId]
      );
      
      console.log('🚀 Профили admin@test.ru, leader@test.ru и student@test.ru успешно добавлены!');
    }

  } catch (error) {
    console.error('❌ Ошибка при инициализации таблиц:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();

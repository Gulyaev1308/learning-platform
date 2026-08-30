const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  console.log('=== Инициализация базы данных PostgreSQL (Релиз MVP) ===');
  try {
    // Принудительно очищаем старые конфликтующие структуры перед накатыванием новой схемы
    console.log('🧹 Очистка старых таблиц для применения новой MVP-архитектуры...');
    await pool.query('DROP TABLE IF EXISTS quiz_answers, progress, lessons, modules, blocks, premium_access, users CASCADE;');

    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await pool.query(`
      -- 1. ПОЛЬЗОВАТЕЛИ
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'leader', 'student')),
        leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ref_code VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. ДИНАМИЧЕСКИЕ БЛОКИ
      CREATE TABLE blocks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 1,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. ДИНАМИЧЕСКИЕ МОДУЛИ
      CREATE TABLE modules (
        id SERIAL PRIMARY KEY,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. УРОКИ
      CREATE TABLE lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK(type IN ('video', 'text', 'quiz', 'practice')),
        content TEXT,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 1,
        quiz_data JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. ПРОГРЕСС ОБУЧЕНИЯ
      CREATE TABLE progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress')),
        video_last_position INTEGER DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );

      -- 6. ОТВЕТЫ НА ОПРОСЫ
      CREATE TABLE quiz_answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        answers JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );

      -- 7. ДОСТУП К ПЛАТНЫМ БЛОКАМ
      CREATE TABLE premium_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, block_id)
      );

      -- ИНДЕКСЫ НА ЧИСТЫЕ ТАБЛИЦЫ
      CREATE INDEX idx_users_leader ON users(leader_id);
      CREATE INDEX idx_blocks_order ON blocks(order_index);
      CREATE INDEX idx_modules_block ON modules(block_id);
      CREATE INDEX idx_lessons_module ON lessons(module_id);
      CREATE INDEX idx_progress_user ON progress(user_id);
      CREATE INDEX idx_quiz_user ON quiz_answers(user_id);
    `);
    console.log('✅ Все новые таблицы, связи и индексы под MVP успешно созданы!');

    console.log('=== Заполнение эталонных профилей ===');
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const leaderHash = await bcrypt.hash('leader123', salt);
    const studentHash = await bcrypt.hash('student123', salt);

    await pool.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@test.ru', $1, 'Главный Админ', 'admin')",
      [adminHash]
    );

    const leaderRes = await pool.query(
      "INSERT INTO users (email, password_hash, name, role, ref_code) VALUES ('leader@test.ru', $1, 'Лидер Siberian Wellness', 'leader', 'sw-leader') RETURNING id"
    );
    const leaderId = leaderRes.rows[0].id;

    await pool.query(
      "INSERT INTO users (email, password_hash, name, role, leader_id) VALUES ('student@test.ru', $1, 'Новичок Сетевого', 'student', $2)",
      [studentHash, leaderId]
    );
    
    console.log('🚀 База данных успешно инициализирована эталонными профилями!');

  } catch (error) {
    console.error('❌ Ошибка при инициализации таблиц:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();

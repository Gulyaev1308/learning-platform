const { Pool } = require('pg');

// Пул автоматически подхватит DATABASE_URL из окружения Docker на сервере
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  console.log('=== Инициализация базы данных PostgreSQL ===');
  try {
    // Создание таблиц с синтаксисом PostgreSQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        leader_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK(type IN ('video', 'text', 'quiz', 'practice')),
        content TEXT,
        block INTEGER NOT NULL CHECK(block IN (1, 2)),
        module INTEGER CHECK(module IN (1, 2)),
        order_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE(user_id, lesson_id)
      );

      CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
      );

      -- Создание индексов для оптимизации запросов в Postgres
      CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_answers(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_leader ON users(leader_id);
    `);

    console.log('✅ Все таблицы и индексы в PostgreSQL успешно созданы!');
  } catch (error) {
    console.error('❌ Ошибка при инициализации таблиц:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();

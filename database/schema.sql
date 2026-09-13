-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  leader_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id)
);

-- Создание таблицы уроков (С изменениями под Кейсы Siberian Wellness)
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('video', 'text', 'quiz', 'practice', 'case')),
  content TEXT,
  block INTEGER NOT NULL CHECK(block IN (1, 2)),
  module INTEGER CHECK(module IN (1, 2)),
  order_index INTEGER NOT NULL,
  case_images TEXT[] DEFAULT '{}',         -- Массив ссылок на фото/видео результатов
  case_details JSONB DEFAULT '{}'::jsonb   -- Метаданные (продукты, сроки, выводы)
);

-- Создание таблицы прогресса студентов
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  UNIQUE(user_id, lesson_id)
);

-- Создание таблицы ответов на квизы
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

-- Индексы для максимальной оптимизации производительности
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_leader ON users(leader_id);
-- Новый индекс для быстрого поиска по JSONB-структуре продуктов
CREATE INDEX IF NOT EXISTS idx_lessons_case_details ON lessons USING gin (case_details);

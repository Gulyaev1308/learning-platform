// Названия блоков
export const BLOCK_NAMES = {
  1: 'Блок 1: Основы',
  2: 'Блок 2: Продвинутый',
} as const;

// Названия модулей
export const MODULE_NAMES = {
  1: 'Модуль 1',
  2: 'Модуль 2',
} as const;

// Названия типов уроков
export const LESSON_TYPES = {
  video: 'Видеоурок',
  text: 'Текст',
  quiz: 'Опрос',
  practice: 'Практика',
} as const;

// Название cookie для сессии
export const SESSION_COOKIE = 'session';

// Время жизни сессии (7 дней)
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

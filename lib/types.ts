// Типы пользователей
export type UserRole = 'student' | 'leader' | 'admin';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  leader_id: number | null;
  created_at: string;
}

// Типы уроков
export type LessonType = 'video' | 'text' | 'quiz' | 'practice';

export interface Lesson {
  id: number;
  title: string;
  type: LessonType;
  content: string;
  block: 1 | 2;
  module: 1 | 2 | null;
  order_index: number;
}

// Прогресс
export interface Progress {
  id: number;
  user_id: number;
  lesson_id: number;
  status: 'completed';
  completed_at: string;
}

// Ответы на опросы
export interface QuizAnswer {
  id: number;
  user_id: number;
  lesson_id: number;
  answer: string;
  created_at: string;
}

// Сессия
export interface SessionData {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

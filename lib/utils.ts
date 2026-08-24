import { Lesson } from './types';

// Форматирование даты
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Расчет процента завершения
export function calculateProgress(completedLessons: number, totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}

// Проверка доступа к уроку
export function canAccessLesson(
  lesson: Lesson,
  completedLessonIds: number[],
  allLessons: Lesson[]
): boolean {
  // Первый урок всегда доступен
  const sortedLessons = allLessons.sort((a, b) => a.order_index - b.order_index);
  const lessonIndex = sortedLessons.findIndex(l => l.id === lesson.id);
  
  if (lessonIndex === 0) return true;
  
  // Проверяем предыдущий урок
  const prevLesson = sortedLessons[lessonIndex - 1];
  return completedLessonIds.includes(prevLesson.id);
}

// Получение статуса урока
export function getLessonStatus(
  lesson: Lesson,
  completedLessonIds: number[],
  allLessons: Lesson[]
): 'completed' | 'available' | 'locked' {
  if (completedLessonIds.includes(lesson.id)) {
    return 'completed';
  }
  
  return canAccessLesson(lesson, completedLessonIds, allLessons) ? 'available' : 'locked';
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Получение последнего урока
export function getLastCompletedLesson(
  lessons: Lesson[],
  completedLessonIds: number[]
): Lesson | null {
  const completedLessons = lessons.filter(l => completedLessonIds.includes(l.id));
  if (completedLessons.length === 0) return null;
  
  return completedLessons.sort((a, b) => b.order_index - a.order_index)[0];
}

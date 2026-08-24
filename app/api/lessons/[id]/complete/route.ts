import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    // Проверяем существование урока
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as any;

    if (!lesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не завершен ли уже урок
    const existingProgress = db.prepare(
      'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ?'
    ).get(session.userId, lessonId);

    if (existingProgress) {
      return NextResponse.json({
        success: true,
        message: 'Урок уже завершен',
        alreadyCompleted: true,
      });
    }

    // Проверяем доступ к уроку (предыдущий должен быть завершен)
    const allLessons = db.prepare(
      'SELECT * FROM lessons ORDER BY order_index'
    ).all() as any[];

    const lessonIndex = allLessons.findIndex(l => l.id === lessonId);

    if (lessonIndex > 0) {
      const prevLesson = allLessons[lessonIndex - 1];
      const prevCompleted = db.prepare(
        'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ? AND status = ?'
      ).get(session.userId, prevLesson.id, 'completed');

      if (!prevCompleted) {
        return NextResponse.json(
          { error: 'Предыдущий урок не завершен' },
          { status: 403 }
        );
      }
    }

    // Создаем запись о завершении
    db.prepare(
      'INSERT INTO progress (user_id, lesson_id, status) VALUES (?, ?, ?)'
    ).run(session.userId, lessonId, 'completed');

    return NextResponse.json({
      success: true,
      message: 'Урок завершен',
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Ошибка при завершении урока' },
      { status: 500 }
    );
  }
}

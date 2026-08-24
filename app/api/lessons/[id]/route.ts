import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as any;

    if (!lesson) {
      return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
    }

    // Проверяем, завершен ли урок
    const completed = db.prepare(
      'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ? AND status = ?'
    ).get(session.userId, lessonId, 'completed');

    if (completed) {
      let content = lesson.content;
      if (lesson.type === 'quiz') {
        try { content = JSON.parse(lesson.content); } catch {}
      }
      return NextResponse.json({
        success: true,
        lesson: { ...lesson, content, completed: true },
      });
    }

    // Проверяем доступ — предыдущий урок должен быть завершен
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
          { error: 'Предыдущий урок не завершен. Пройдите уроки по порядку.', locked: true },
          { status: 403 }
        );
      }
    }

    let content = lesson.content;
    if (lesson.type === 'quiz') {
      try { content = JSON.parse(lesson.content); } catch {}
    }

    return NextResponse.json({
      success: true,
      lesson: { ...lesson, content, completed: false },
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Ошибка при получении урока' }, { status: 500 });
  }
}

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

    // Проверяем, что урок типа quiz
    if (lesson.type !== 'quiz') {
      return NextResponse.json(
        { error: 'Этот урок не является опросом' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { answer } = body;

    if (!answer) {
      return NextResponse.json(
        { error: 'Ответ обязателен' },
        { status: 400 }
      );
    }

    // Сохраняем ответ
    db.prepare(
      'INSERT INTO quiz_answers (user_id, lesson_id, answer) VALUES (?, ?, ?)'
    ).run(session.userId, lessonId, answer);

    return NextResponse.json({
      success: true,
      message: 'Ответ сохранен',
    });
  } catch (error) {
    console.error('Error saving quiz answer:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении ответа' },
      { status: 500 }
    );
  }
}

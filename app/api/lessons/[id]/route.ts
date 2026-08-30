import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { id: lessonId } = await params;

    const result = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
    const lesson = result.rows[0]; // ИСПРАВЛЕНО: строго берем объект строки

    if (!lesson) return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });

    // ИСПРАВЛЕНО: Безопасный парсинг с иммунитетом к строкам "[object Object]"
    let parsedQuizData = [];
    if (lesson.quiz_data) {
      if (typeof lesson.quiz_data === 'object') {
        parsedQuizData = lesson.quiz_data;
      } else if (typeof lesson.quiz_data === 'string' && lesson.quiz_data !== '[object Object]') {
        try {
          parsedQuizData = JSON.parse(lesson.quiz_data);
        } catch (e) {
          console.error('JSON parse error, falling back to empty array');
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      lesson: { ...lesson, quiz_data: parsedQuizData } 
    });
  } catch (error) {
    console.error('Error fetching single lesson:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

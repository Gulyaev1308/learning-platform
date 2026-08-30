import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const currentUserId = session.userId || (session as any).id;
    const { id: lessonId } = await params;
    const { answers } = await request.json();

    const jsonString = JSON.stringify(answers || []);

    // Сохраняем ответы новичка в базу данных
    await db.query(`
      INSERT INTO quiz_answers (user_id, lesson_id, answers)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET answers = $3, created_at = CURRENT_TIMESTAMP
    `, [currentUserId, lessonId, jsonString]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz submit route error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: studentId } = await params;

    // Вытягиваем ответы на опросы конкретного студента, подтягивая названия уроков
    const result = await db.query(`
      SELECT 
        qa.id,
        qa.answers,
        qa.created_at,
        l.title as lesson_title
      FROM quiz_answers qa
      INNER JOIN lessons l ON l.id = qa.lesson_id
      WHERE qa.user_id = $1
      ORDER BY qa.created_at DESC
    `, [studentId]);

    return NextResponse.json({ success: true, answers: result.rows });
  } catch (error) {
    console.error('Error fetching student quiz answers:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

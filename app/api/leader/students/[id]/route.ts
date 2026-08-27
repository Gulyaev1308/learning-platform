import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: studentId } = await params;

    // Проверяем, что ученик принадлежит этому лидеру
    const student = (await db.query('SELECT * FROM users WHERE id = $1 AND leader_id = $2 AND role = $3', [studentId, session.userId, 'student'])).rows[0];
    
    if (!student) {
      return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 });
    }

    // Удаляем связанные данные
    await db.query('DELETE FROM progress WHERE user_id = $1', [studentId]);
    await db.query('DELETE FROM quiz_answers WHERE user_id = $1', [studentId]);
    await db.query('DELETE FROM users WHERE id = $1', [studentId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Очищаем таблицы в правильном порядке (без PRAGMA)
    await db.query('DELETE FROM quiz_answers');
    await db.query('DELETE FROM progress');
    await db.query('DELETE FROM lessons');
    await db.query('DELETE FROM modules');
    await db.query('DELETE FROM blocks');
    await db.query("DELETE FROM users WHERE role != 'admin'");

    return NextResponse.json({ success: true, message: 'База очищена' });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const currentLeaderId = session.userId || (session as any).id;

    // Выбираем всех студентов, закрепленных за этим лидером
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE leader_id = $1 AND role = $2 ORDER BY id DESC',
      [currentLeaderId, 'student']
    );

    return NextResponse.json({ success: true, students: result.rows });
  } catch (error) {
    console.error('Error in GET /api/leader/students:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

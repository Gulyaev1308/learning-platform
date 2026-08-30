import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const currentLeaderId = session.userId || (session as any).id;
    const { student_id, block_id, action } = await request.json();

    if (!student_id || !block_id || !action) {
      return NextResponse.json({ error: 'Не все параметры переданы' }, { status: 400 });
    }

    await db.query(`
      INSERT INTO premium_access (user_id, block_id, status, approved_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, block_id) 
      DO UPDATE SET status = $3, approved_by = $4, updated_at = CURRENT_TIMESTAMP
    `, [student_id, block_id, action, currentLeaderId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

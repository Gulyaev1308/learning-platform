import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: leaderId } = await params;

    const lessons = db.prepare(`
      SELECT * FROM lessons 
      WHERE leader_id = ? OR leader_id IS NULL
      ORDER BY block, module, order_index
    `).all(leaderId) as any[];

    return NextResponse.json({ success: true, lessons });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при получении уроков' }, { status: 500 });
  }
}

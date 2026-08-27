import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id: leaderId } = await params;

  const blocks = (await db.query(`
    SELECT b.*, 
      (SELECT COUNT(*) FROM modules m WHERE m.block_id = b.id) as modules_count,
      (SELECT COUNT(*) FROM lessons l WHERE l.block_id = b.id) as lessons_count
    FROM blocks b
    WHERE b.leader_id = $1
    ORDER BY b.order_index
  `, [leaderId])).rows as any[];

  return NextResponse.json({ success: true, blocks });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id: leaderId } = await params;
  const { title, order_index } = await request.json();

  const result = db.prepare(
    'INSERT INTO blocks (leader_id, title, order_index) VALUES (?, ?, ?)'
  ).run(leaderId, title, order_index || 1);

  return NextResponse.json({ success: true, blockId: result.rows[0].id });
}

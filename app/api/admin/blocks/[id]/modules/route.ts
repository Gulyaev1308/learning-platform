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

  const { id: blockId } = await params;

  const modules = (await db.query(`
    SELECT m.*, 
      (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) as lessons_count
    FROM modules m
    WHERE m.block_id = $1
    ORDER BY m.order_index
  `, [blockId])).rows as any[];

  return NextResponse.json({ success: true, modules });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id: blockId } = await params;
  const { title, order_index } = await request.json();

  const result = db.prepare(
    'INSERT INTO modules (block_id, title, order_index) VALUES (?, ?, ?)'
  ).run(blockId, title, order_index || 1);

  return NextResponse.json({ success: true, moduleId: result.rows[0].id });
}

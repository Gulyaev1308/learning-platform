import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id } = await params;
  const result = await db.query('SELECT * FROM blocks WHERE leader_id = $1 ORDER BY order_index', [id]);
  return NextResponse.json({ success: true, blocks: result.rows });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id } = await params;
  const { title } = await request.json();
  const result = await db.query('INSERT INTO blocks (leader_id, title) VALUES ($1, $2) RETURNING id', [id, title]);
  return NextResponse.json({ success: true, blockId: result.rows[0].id });
}

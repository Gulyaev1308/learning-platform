import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id } = await params;
  const { title, type, content, description, quiz_data, homework_data, block_id, module_id, order_index } = await request.json();
  await db.query(
    'UPDATE lessons SET title = $1, type = $2, content = $3, description = $4, quiz_data = $5, homework_data = $6, block_id = $7, module_id = $8, order_index = $9 WHERE id = $10',
    [title, type, content, description, quiz_data, homework_data, block_id, module_id, order_index, id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id } = await params;
  await db.query('DELETE FROM progress WHERE lesson_id = $1', [id]);
  await db.query('DELETE FROM quiz_answers WHERE lesson_id = $1', [id]);
  await db.query('DELETE FROM lessons WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}

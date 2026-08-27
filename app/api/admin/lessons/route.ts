import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { title, type, content, description, quiz_data, homework_data, block_id, module_id, order_index, leader_id } = await request.json();
  const result = await db.query(
    'INSERT INTO lessons (title, type, content, description, quiz_data, homework_data, block_id, module_id, order_index, leader_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
    [title, type, content || '', description || '', quiz_data || '', homework_data || '', block_id, module_id, order_index || 1, leader_id]
  );
  return NextResponse.json({ success: true, lessonId: result.rows[0].id });
}

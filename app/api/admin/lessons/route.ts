import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, content, description, block_id, module_id, order_index, leader_id } = body;

    const result = db.prepare(
      'INSERT INTO lessons (title, type, content, description, block_id, module_id, order_index, leader_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      title,
      type,
      content || '',
      description || '',
      block_id || null,
      module_id || null,
      order_index || 1,
      leader_id || null
    );

    return NextResponse.json({ success: true, lessonId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

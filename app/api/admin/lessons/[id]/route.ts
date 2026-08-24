import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);
    const body = await request.json();
    const { title, type, content, description, module_id, block_id, order_index, leader_id } = body;

    db.prepare(
      'UPDATE lessons SET title = ?, type = ?, content = ?, description = ?, module_id = ?, block_id = ?, order_index = ?, leader_id = ? WHERE id = ?'
    ).run(title, type, content || '', description || '', module_id || null, block_id || null, order_index || 1, leader_id || null, lessonId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    db.prepare('DELETE FROM progress WHERE lesson_id = ?').run(lessonId);
    db.prepare('DELETE FROM quiz_answers WHERE lesson_id = ?').run(lessonId);
    db.prepare('DELETE FROM lessons WHERE id = ?').run(lessonId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}

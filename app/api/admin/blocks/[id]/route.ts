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

    const { id: blockId } = await params;
    const { title, is_premium } = await request.json();

    // Исправлено: Явно передаем и обновляем поле is_premium в базе данных
    await db.query(
      'UPDATE blocks SET title = COALESCE($1, title), is_premium = COALESCE($2, is_premium) WHERE id = $3',
      [title, is_premium ?? false, blockId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
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

    const { id: blockId } = await params;
    await db.query('DELETE FROM blocks WHERE id = $1', [blockId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

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
    const body = await request.json();
    
    // ЖЕСТКАЯ ПРОВЕРИКА: Ловим и строку "true", и булево true из любых версий фронтенда
    const isPremium = body.is_premium === true || body.is_premium === 'true';

    // Обновляем запись в базе данных
    await db.query(
      'UPDATE blocks SET title = COALESCE($1, title), is_premium = $2 WHERE id = $3',
      [body.title, isPremium, blockId]
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
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    const { id: blockId } = await params;
    await db.query('DELETE FROM blocks WHERE id = $1', [blockId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

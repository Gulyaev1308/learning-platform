import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }
  
  const result = await db.query('SELECT * FROM blocks ORDER BY order_index ASC');
  return NextResponse.json({ success: true, blocks: result.rows });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { title } = await request.json();

    const maxOrderResult = await db.query('SELECT COALESCE(MAX(order_index), 0) as max_order FROM blocks');
    const nextOrder = maxOrderResult.rows[0].max_order + 1;

    const result = await db.query(
      'INSERT INTO blocks (title, order_index) VALUES ($1, $2) RETURNING id',
      [title, nextOrder]
    );

    // ИСПРАВЛЕНО: берем первый элемент массива rows[0]
    return NextResponse.json({ success: true, blockId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

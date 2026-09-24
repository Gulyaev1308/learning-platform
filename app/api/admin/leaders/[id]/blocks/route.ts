import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id: leaderId } = await params;
  
  const result = await db.query('SELECT * FROM blocks WHERE leader_id = $1 ORDER BY order_index ASC', [leaderId]);
  return NextResponse.json({ success: true, blocks: result.rows });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id: leaderId } = await params;

  try {
    // ИСПРАВЛЕНО: Теперь извлекаем is_premium из запроса фронтенда
    const { title, is_premium } = await request.json();
    
    // Безопасное приведение к логическому типу (boolean)
    const isPremiumBlock = is_premium === true || is_premium === 'true' || is_premium === 1;

    const maxOrderResult = await db.query('SELECT COALESCE(MAX(order_index), 0) as max_order FROM blocks WHERE leader_id = $1', [leaderId]);
    const nextOrder = maxOrderResult.rows[0].max_order + 1;

    // ИСПРАВЛЕНО: Добавлено поле is_premium и его значение в SQL-запрос
    const result = await db.query(
      'INSERT INTO blocks (leader_id, title, order_index, is_premium) VALUES ($1, $2, $3, $4) RETURNING id',
      [leaderId, title, nextOrder, isPremiumBlock]
    );

    return NextResponse.json({ success: true, blockId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

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
    const { title, type, content, description, quiz_data, module_id, order_index } = await request.json();

    const dbQuizData = typeof quiz_data === 'object' ? JSON.stringify(quiz_data) : (quiz_data || '[]');

    // ИСПРАВЛЕНО: Убраны несуществующие колонки block_id, homework_data и leader_id.
    // Обновление идет строго по валидным колонкам таблицы lessons из init.js
    await db.query(
      `UPDATE lessons 
       SET title = COALESCE($1, title), 
           type = COALESCE($2, type), 
           content = COALESCE($3, content), 
           description = COALESCE($4, description), 
           quiz_data = COALESCE($5, quiz_data), 
           module_id = COALESCE($6, module_id), 
           order_index = COALESCE($7, order_index)::integer 
       WHERE id = $8`,
      [title, type, content, description, dbQuizData, module_id, order_index, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson order/data:', error);
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

    const { id } = await params;
    await db.query('DELETE FROM lessons WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

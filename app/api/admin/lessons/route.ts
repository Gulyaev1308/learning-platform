import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { 
      title, 
      type, 
      content, 
      description, 
      quiz_data, 
      module_id, 
      order_index 
    } = await request.json();

    // Защита: проверяем, что передан id существующего модуля
    if (!module_id) {
      return NextResponse.json({ error: 'Не указан ID модуля' }, { status: 400 });
    }

    // Подготовка опросов: если передан объект/массив, превращаем его в строку для JSONB поля
    const formattedQuizData = typeof quiz_data === 'object' 
      ? JSON.stringify(quiz_data) 
      : (quiz_data || '[]');

    // ИСПРАВЛЕНО: убраны лишние колонки block_id, homework_data и leader_id.
    // Урок теперь связывается с базой исключительно через module_id.
    const result = await db.query(
      `INSERT INTO lessons (title, type, content, description, quiz_data, module_id, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        title, 
        type, 
        content || '', 
        description || '', 
        formattedQuizData, 
        module_id, 
        order_index || 1
      ]
    );

    return NextResponse.json({ success: true, lessonId: result.rows[0].id });
  } catch (error) {
    console.error('Error in POST /api/admin/lessons:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера при создании урока' }, { status: 500 });
  }
}

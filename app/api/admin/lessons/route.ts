import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });

  try {
    const { title, type, content, description, quiz_data, module_id, order_index } = await request.json();
    if (!module_id) return NextResponse.json({ error: 'Не указан ID модуля' }, { status: 400 });

    const dbQuizData = typeof quiz_data === 'object' ? JSON.stringify(quiz_data) : (quiz_data || '[]');

    const result = await db.query(
      `INSERT INTO lessons (title, type, content, description, quiz_data, module_id, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [title, type, content || '', description || '', dbQuizData, module_id, order_index || 1]
    );

    return NextResponse.json({ success: true, lessonId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

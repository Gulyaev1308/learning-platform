import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });

  try {
    const body = await request.json();
    const { 
      title, 
      type, 
      content, 
      description, 
      quiz_data, 
      module_id, 
      order_index,
      case_images, // Массив строк с фронтенда (ссылки на медиа)
      case_details // Объект метаданных кейса (продукты, сроки)
    } = body;

    if (!module_id) return NextResponse.json({ error: 'Не указан ID модуля' }, { status: 400 });

    // Обработка данных квиза (старая логика)
    const dbQuizData = typeof quiz_data === 'object' ? JSON.stringify(quiz_data) : (quiz_data || '[]');

    // Безопасное приведение к типам PostgreSQL для кейсов Siberian Wellness
    // Если тип не 'case', пишем дефолтные пустые значения
    const dbCaseImages = type === 'case' && Array.isArray(case_images) ? case_images : [];
    const dbCaseDetails = type === 'case' && case_details ? JSON.stringify(case_details) : '{}';

    const result = await db.query(
      `INSERT INTO lessons (
        title, type, content, description, quiz_data, module_id, order_index, case_images, case_details
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        title, 
        type, 
        content || '', 
        description || '', 
        dbQuizData, 
        module_id, 
        order_index || 1,
        dbCaseImages,      // Передаем как родной массив строк в Postgres (TEXT[])
        dbCaseDetails      // Передаем как валидную JSON-строку для записи в JSONB
      ]
    );

    return NextResponse.json({ success: true, lessonId: result.rows[0].id });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

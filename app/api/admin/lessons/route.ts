import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    console.warn('[AUTH_WARN] [POST /api/admin/lessons] Попытка несанкционированного доступа');
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      title, 
      type, 
      content, 
      description, 
      quiz_data, 
      module_id, 
      // ИСПРАВЛЕНО: order_index больше не принимаем с фронтенда, рассчитываем сами
      case_images, 
      case_details 
    } = body;

    console.log(`[LESSON_CREATE_START] Запрос на создание урока: "${title}" (Тип: ${type})`);

    if (!module_id) {
      return NextResponse.json({ error: 'Не указан ID модуля' }, { status: 400 });
    }

    // ИСПРАВЛЕНО: Автоматический расчет следующего порядка урока внутри конкретного модуля
    const maxOrderResult = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) as max_order FROM lessons WHERE module_id = \$1',
      [module_id]
    );
    const nextOrder = maxOrderResult.rows[0].max_order + 1;

    // Обработка данных квиза
    const dbQuizData = typeof quiz_data === 'object' ? JSON.stringify(quiz_data) : (quiz_data || '[]');

    // Точечный фикс: обходим ограничение базы данных, сохраняя кейс как тип text
    const dbType = type === 'case' ? 'text' : type;

    // Строго приводим case_images к JSON-строке для корректной записи в поле типа JSONB
    const dbCaseImages = type === 'case' && Array.isArray(case_images) 
      ? JSON.stringify(case_images) 
      : '[]';
      
    const dbCaseDetails = type === 'case' && case_details 
      ? JSON.stringify(case_details) 
      : '{}';

    console.log(`[LESSON_CREATE_DB] Запись в PostgreSQL. Путь контента: "${content || ''}". Порядок: ${nextOrder}`);

    const result = await db.query(
      `INSERT INTO lessons (
        title, type, content, description, quiz_data, module_id, order_index, case_images, case_details
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        title, 
        dbType, 
        content || '', 
        description || '', 
        dbQuizData, 
        module_id, 
        nextOrder, // ИСПРАВЛЕНО: Передаем автоматически вычисленный порядковый номер
        dbCaseImages,      
        dbCaseDetails      
      ]
    );

    console.log(`[LESSON_CREATE_SUCCESS] Урок успешно создан в БД. Присвоен ID: ${result.rows[0].id}`);
    return NextResponse.json({ success: true, lessonId: result.rows[0].id });

  } catch (error: any) {
    console.error('❌ Ошибка создания урока:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

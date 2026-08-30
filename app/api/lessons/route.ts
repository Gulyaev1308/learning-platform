import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    // Берём из сессии чистый id пользователя
    const currentUserId = session.userId || (session as any).id;

    // Сначала получаем данные о самом пользователе
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [currentUserId]);
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    // Вытягиваем всю цепочку контента через правильные JOIN-связи
    const allLessonsResult = await db.query(`
      SELECT 
        l.*, 
        b.id as block_id, 
        b.title as block_title, 
        m.id as module_id, 
        m.title as module_title
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      INNER JOIN blocks b ON b.id = m.block_id
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `);

    const allLessons = allLessonsResult.rows;

    // Вытягиваем прогресс завершённых уроков студента
    const progressResult = await db.query(
      'SELECT lesson_id FROM progress WHERE user_id = $1 AND status = $2',
      [currentUserId, 'completed']
    );
    const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));

    // Просчитываем лестницу доступности уроков
    let previousCompleted = true;
    const lessonsWithStatus = allLessons.map((lesson, index) => {
      const isCompleted = completedIds.has(lesson.id);
      
      let status: string;
      if (isCompleted) status = 'completed';
      else if (index === 0 || previousCompleted) status = 'available';
      else status = 'locked';
      
      previousCompleted = isCompleted;
      return { ...lesson, status };
    });

    // Группируем по блокам и модулям для фронтенда
    const blocksMap = new Map();
    for (const lesson of lessonsWithStatus) {
      if (!blocksMap.has(lesson.block_id)) {
        blocksMap.set(lesson.block_id, {
          id: lesson.block_id,
          title: lesson.block_title,
          modules: new Map(),
        });
      }
      
      const block = blocksMap.get(lesson.block_id);
      if (!block.modules.has(lesson.module_id)) {
        block.modules.set(lesson.module_id, {
          id: lesson.module_id,
          title: lesson.module_title,
          lessons: [],
        });
      }
      
      block.modules.get(lesson.module_id).lessons.push(lesson);
    }

    const result = [];
    for (const block of blocksMap.values()) {
      const modules = [];
      for (const mod of block.modules.values()) {
        modules.push(mod);
      }
      result.push({ ...block, modules });
    }

    const totalLessons = allLessons.length;
    const completedLessons = completedIds.size;

    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons,
      completedLessons,
      progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    });
  } catch (error) {
    console.error('Error fetching student dashboard lessons:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

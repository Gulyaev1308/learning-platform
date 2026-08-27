import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [session.userId]);
  const user = userResult.rows[0];
  const leaderId = user?.role === 'student' ? user.leader_id : user?.id;

  // Получаем все уроки по порядку
  const allLessonsResult = await db.query(`
    SELECT l.*, b.id as block_id, b.title as block_title, m.id as module_id, m.title as module_title
    FROM lessons l
    LEFT JOIN blocks b ON b.id = l.block_id
    LEFT JOIN modules m ON m.id = l.module_id
    WHERE b.leader_id = $1 OR b.leader_id IS NULL
    ORDER BY b.order_index, m.order_index, l.order_index, l.id
  `, [leaderId]);

  const allLessons = allLessonsResult.rows;

  // Получаем завершенные уроки
  const progressResult = await db.query(
    'SELECT lesson_id FROM progress WHERE user_id = $1 AND status = $2',
    [session.userId, 'completed']
  );
  const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));

  // Определяем статус каждого урока (лестница)
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

  // Группируем по блокам и модулям
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

  // Конвертируем в массив
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
}

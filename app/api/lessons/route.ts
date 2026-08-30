import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [session.userId]);
  const user = userResult.rows[0];
  const leaderId = user?.role === 'student' ? user.leader_id : user?.id;

  // ИСПРАВЛЕНО: заменены l.block_id/l.module_id на l.block/l.module в соответствии с init.js
  const allLessonsResult = await db.query(`
    SELECT l.*, l.block as block_id, l.module as module_id
    FROM lessons l
    WHERE l.leader_id = $1 OR l.leader_id IS NULL
    ORDER BY l.block, l.module, l.order_index, l.id
  `, [leaderId]);

  const allLessons = allLessonsResult.rows;

  const progressResult = await db.query(
    'SELECT lesson_id FROM progress WHERE user_id = $1 AND status = $2',
    [session.userId, 'completed']
  );
  const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));

  let previousCompleted = true;
  const lessonsWithStatus = allLessons.map((lesson, index) => {
    const isCompleted = completedIds.has(lesson.id);
    
    let status: string;
    if (isCompleted) status = 'completed';
    else if (index === 0 || previousCompleted) status = 'available';
    else status = 'locked';
    
    previousCompleted = isCompleted;
    
    return { ...lesson, status, block_title: `Блок ${lesson.block}`, module_title: `Модуль ${lesson.module}` };
  });

  const blocksMap = new Map();
  
  for (const lesson of lessonsWithStatus) {
    if (!blocksMap.has(lesson.block_id)) {
      blocksMap.set(lesson.block_id, {
        id: lesson.block_id,
        title: `Блок ${lesson.block_id}`,
        modules: new Map(),
      });
    }
    
    const block = blocksMap.get(lesson.block_id);
    
    if (!block.modules.has(lesson.module_id)) {
      block.modules.set(lesson.module_id, {
        id: lesson.module_id,
        title: `Модуль ${lesson.module_id}`,
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
}

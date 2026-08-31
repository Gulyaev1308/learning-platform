import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const currentUserId = session.userId || (session as any).id;

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [currentUserId]);
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    const filterLeaderId = user.role === 'student' ? user.leader_id : user.id;

    const allLessonsResult = await db.query(`
      SELECT 
        l.*, 
        b.id as block_id, 
        b.title as block_title, 
        b.is_premium as block_is_premium,
        m.id as module_id, 
        m.title as module_title
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      INNER JOIN blocks b ON b.id = m.block_id
      WHERE b.leader_id = $1 OR b.leader_id IS NULL
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `, [filterLeaderId]);

    const paymentsResult = await db.query(
      "SELECT block_id FROM premium_access WHERE user_id = $1 AND status = 'approved'",
      [currentUserId]
    );
    const approvedBlockIds = new Set(paymentsResult.rows.map(r => r.block_id));

    const progressResult = await db.query(
      "SELECT lesson_id FROM progress WHERE user_id = $1 AND status = 'completed'",
      [currentUserId]
    );
    const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));

    let previousCompleted = true;
    
    const lessonsWithStatus = allLessonsResult.rows.map((lesson, index) => {
      const isCompleted = completedIds.has(lesson.id);
      
      // Бронированная проверка платного блока
      const isBlockLockedByPayment = user.role === 'student' && 
                                     lesson.block_is_premium === true && 
                                     !approvedBlockIds.has(lesson.block_id);
      
      let status: string;
      if (isBlockLockedByPayment) {
        status = 'locked';
      } else if (isCompleted) {
        status = 'completed';
      } else if (index === 0 || previousCompleted) {
        status = 'available';
      } else {
        status = 'locked';
      }
      
      if (isBlockLockedByPayment) {
        previousCompleted = false;
      } else {
        previousCompleted = isCompleted;
      }

      return { ...lesson, status };
    });

    const blocksMap = new Map();
    for (const lesson of lessonsWithStatus) {
      if (!blocksMap.has(lesson.block_id)) {
        blocksMap.set(lesson.block_id, {
          id: lesson.block_id,
          title: lesson.block_title,
          is_premium: lesson.block_is_premium,
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

    const result = Array.from(blocksMap.values()).map(b => ({
      ...b,
      modules: Array.from(b.modules.values()).map((m: any) => ({
        ...m,
        lessons: m.lessons
      }))
    }));

    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons: allLessonsResult.rows.length,
      completedLessons: completedIds.size,
      progressPercent: allLessonsResult.rows.length > 0 ? Math.round((completedIds.size / allLessonsResult.rows.length) * 100) : 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

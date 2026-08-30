import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const currentUserId = session.userId || (session as any).id;

    // 1. Получаем данные о текущем студенте, чтобы знать его leader_id
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [currentUserId]);
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    // 2. Вытягиваем все уроки, модули и блоки платформы с их order_index
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
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `);

    // 3. Проверяем, какие блоки были ОДОБРЕНЫ лидером для этого конкретного студента
    const paymentsResult = await db.query(
      "SELECT block_id FROM premium_access WHERE user_id = $1 AND status = 'approved'",
      [currentUserId]
    );
    const approvedBlockIds = new Set(paymentsResult.rows.map(r => r.block_id));

    const allLessons = allLessonsResult.rows;

    // 4. Получаем список уже завершенных студентом уроков
    const progressResult = await db.query(
      "SELECT lesson_id FROM progress WHERE user_id = $1 AND status = 'completed'",
      [currentUserId]
    );
    const completedIds = new Set(progressResult.rows.map(r => r.lesson_id));

    let previousCompleted = true;
    
    // 5. Просчитываем лестницу доступности контента
    const lessonsWithStatus = allLessons.map((lesson, index) => {
      const isCompleted = completedIds.has(lesson.id);
      
      let status: string;
      
      // ЖЕСТКИЙ ФИКС: Если блок платный (is_premium = true) и лидер его НЕ одобрил —
      // урок безоговорочно блокируется ('locked'), лестница дальше не идет!
      if (lesson.block_is_premium && !approvedBlockIds.has(lesson.block_id)) {
        status = 'locked'; 
      } else if (isCompleted) {
        status = 'completed';
      } else if (index === 0 || previousCompleted) {
        status = 'available';
      } else {
        status = 'locked';
      }
      
      // Если текущий урок заблокирован из-за неоплаты, то и все последующие тоже закроются
      if (lesson.block_is_premium && !approvedBlockIds.has(lesson.block_id)) {
        previousCompleted = false;
      } else {
        previousCompleted = isCompleted;
      }

      return { ...lesson, status };
    });

    // Группируем обработанные уроки по блокам и модулям для дашборда новичка
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

    const result = [];
    for (const block of blocksMap.values()) {
      const modules = [];
      for (const mod of block.modules.values()) {
        modules.push(mod);
      }
      result.push({ ...block, modules });
    }

    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons: allLessons.length,
      completedLessons: completedIds.size,
      progressPercent: allLessons.length > 0 ? Math.round((completedIds.size / allLessons.length) * 100) : 0,
    });
  } catch (error) {
    console.error('Error in student lessons roadmap:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const currentLeaderId = session.userId || (session as any).id;

    // 1. ВАШ СЛОЖНЫЙ АГРЕГИРУЮЩИЙ ЗАПРОС (Оставляем без изменений, он считает 75% идеально)
    const result = await db.query(
      `SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.created_at,
        
        -- Считаем количество выполненных уроков студентом
        COALESCE(COUNT(DISTINCT p.lesson_id), 0)::integer as completed_lessons,
        
        -- Считаем общее число уроков, привязанных к блокам этого лидера (или общих блоков)
        (SELECT COUNT(l.id) FROM lessons l 
         INNER JOIN modules m ON m.id = l.module_id
         INNER JOIN blocks b ON b.id = m.block_id
         WHERE b.leader_id = $1 OR b.leader_id IS NULL)::integer as total_lessons,

        -- Вычисляем точный процент с плавающей точкой и округлением до целого
        COALESCE(
          ROUND(
            (COUNT(DISTINCT p.lesson_id)::numeric / 
            NULLIF((SELECT COUNT(l.id) FROM lessons l 
                    INNER JOIN modules m ON m.id = l.module_id
                    INNER JOIN blocks b ON b.id = m.block_id
                    WHERE b.leader_id = $1 OR b.leader_id IS NULL), 0)
            ) * 100
          ), 0
        )::integer as progress_percent,

        -- Находим название последнего завершенного урока
        (SELECT l2.title FROM progress p2
         INNER JOIN lessons l2 ON l2.id = p2.lesson_id
         WHERE p2.user_id = u.id AND p2.status = 'completed'
         ORDER BY p2.completed_at DESC LIMIT 1) as last_lesson

      FROM users u
      LEFT JOIN progress p ON p.user_id = u.id AND p.status = 'completed'
      WHERE u.leader_id = $1 AND u.role = $2
      GROUP BY u.id
      ORDER BY u.id DESC`,
      [currentLeaderId, 'student']
    );

    // 2. Получаем всю структуру обучения (блоки и уроки) для анализа "лестницы"
    const courseStructureResult = await db.query(`
      SELECT 
        l.id as lesson_id, l.title as lesson_title,
        b.id as block_id, b.title as block_title, b.is_premium as block_is_premium
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      INNER JOIN blocks b ON b.id = m.block_id
      WHERE b.leader_id = $1 OR b.leader_id IS NULL
      ORDER BY b.order_index ASC, m.order_index ASC, l.order_index ASC
    `, [currentLeaderId]);

    const allLessons = courseStructureResult.rows;

    // 3. Динамически рассчитываем точку блокировки для каждого студента
    const calculatedStudents = await Promise.all(
      result.rows.map(async (student) => {
        // Вытягиваем пройденные уроки именно этого студента
        const progressRes = await db.query(
          "SELECT lesson_id FROM progress WHERE user_id = $1 AND status = 'completed'",
          [student.id]
        );
        const completedIds = new Set(progressRes.rows.map(r => r.lesson_id));

        // Вытягиваем уже одобренные доступы этого студента
        const paymentsRes = await db.query(
          "SELECT block_id FROM premium_access WHERE user_id = $1 AND status = 'approved'",
          [student.id]
        );
        const approvedBlockIds = new Set(paymentsRes.rows.map(r => Number(r.block_id)));

        let currentLockedBlockId: number | null = null;
        let currentLockedBlockTitle: string | null = null;
        let foundFirstUncompleted = false;

        // Бежим по лестнице уроков и ищем первый непройденный заблокированный платный блок
        for (const lesson of allLessons) {
          const isCompleted = completedIds.has(lesson.lesson_id);
          const isPremiumBlock = 
            lesson.block_is_premium === true || 
            lesson.block_is_premium === 'true' || 
            lesson.block_is_premium === 1 || 
            String(lesson.block_title).toLowerCase().includes('платный');
          
          const hasLeaderApproved = approvedBlockIds.has(Number(lesson.block_id));

          if (!isCompleted && !foundFirstUncompleted) {
            foundFirstUncompleted = true;
            // Если студент уперся в платный блок, который еще не одобрен лидером
            if (isPremiumBlock && !hasLeaderApproved) {
              currentLockedBlockId = Number(lesson.block_id);
              currentLockedBlockTitle = lesson.block_title;
              break; // Нашли текущую точку останова, выходим из цикла
            }
          }
        }

        return {
          ...student,
          current_locked_block_id: currentLockedBlockId,
          current_locked_block_title: currentLockedBlockTitle
        };
      })
    );

    // Возвращаем структуру один в один с добавлением умных динамических полей
    return NextResponse.json({ 
      success: true, 
      students: calculatedStudents,
      leaderId: currentLeaderId 
    });
  } catch (error) {
    console.error('Error in GET /api/leader/students:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

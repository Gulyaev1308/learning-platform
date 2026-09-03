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

    // СЛОЖНЫЙ АГРЕГИРУЮЩИЙ ЗАПРОС: считает реальный прогресс без регрессии типов
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

    // Возвращаем структуру один в один, сохраняя обратную совместимость
    return NextResponse.json({ 
      success: true, 
      students: result.rows,
      leaderId: currentLeaderId 
    });
  } catch (error) {
    console.error('Error in GET /api/leader/students:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

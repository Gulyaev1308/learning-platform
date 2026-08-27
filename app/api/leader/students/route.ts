import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    if (session.role !== 'leader') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Получаем всех учеников этого лидера
    const students = (await db.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.created_at,
        COUNT(DISTINCT p.lesson_id) as completed_lessons,
        (SELECT COUNT(*) FROM lessons) as total_lessons,
        (SELECT l.title FROM lessons l 
         INNER JOIN progress p2 ON p2.lesson_id = l.id 
         WHERE p2.user_id = u.id 
         ORDER BY p2.completed_at DESC 
         LIMIT 1) as last_lesson
      FROM users u
      LEFT JOIN progress p ON p.user_id = u.id AND p.status = 'completed'
      WHERE u.leader_id = $1 AND u.role = 'student'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, [session.userId])).rows as any[];

    // Рассчитываем процент для каждого ученика
    const studentsWithProgress = students.map(student => ({
      ...student,
      progress_percent: student.total_lessons > 0 
        ? Math.round((student.completed_lessons / student.total_lessons) * 100)
        : 0,
    }));

    return NextResponse.json({
      success: true,
      students: studentsWithProgress,
      leaderId: session.userId,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении учеников' },
      { status: 500 }
    );
  }
}

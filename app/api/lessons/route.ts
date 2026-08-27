import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [session.userId]);
  const user = userResult.rows[0];
  const leaderId = user?.role === 'student' ? user.leader_id : user?.id;

  const blocksResult = await db.query('SELECT * FROM blocks WHERE leader_id = $1 ORDER BY order_index, id', [leaderId]);
  const blocks = blocksResult.rows;

  const result = [];
  let totalLessons = 0;
  let completedLessons = 0;

  for (const block of blocks) {
    const modulesResult = await db.query('SELECT * FROM modules WHERE block_id = $1 ORDER BY order_index, id', [block.id]);
    const modules = modulesResult.rows;

    const modulesWithLessons = [];

    for (const mod of modules) {
      const lessonsResult = await db.query('SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index, id', [mod.id]);
      const lessons = lessonsResult.rows;

      const lessonsWithStatus = [];
      for (const lesson of lessons) {
        totalLessons++;
        const progress = await db.query('SELECT * FROM progress WHERE user_id = $1 AND lesson_id = $2', [session.userId, lesson.id]);
        if (progress.rows.length > 0) completedLessons++;
        lessonsWithStatus.push({ ...lesson, status: progress.rows.length > 0 ? 'completed' : 'available' });
      }

      modulesWithLessons.push({ ...mod, lessons: lessonsWithStatus });
    }

    result.push({ ...block, modules: modulesWithLessons });
  }

  return NextResponse.json({
    success: true,
    lessons: result,
    totalLessons,
    completedLessons,
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
  });
}

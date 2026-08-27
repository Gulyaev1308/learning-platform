import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
    const leaderId = user?.role === 'student' ? user.leader_id : user?.id;

    console.log('User:', user?.id, user?.role, 'leaderId:', leaderId);

    // Получаем блоки
    const blocks = db.prepare(
      'SELECT * FROM blocks WHERE leader_id = ? OR leader_id IS NULL ORDER BY order_index, id'
    ).all(leaderId) as any[];

    console.log('Blocks found:', blocks.length);

    const result = [];
    let totalLessons = 0;
    let completedLessons = 0;

    for (const block of blocks) {
      const modules = db.prepare(
        'SELECT * FROM modules WHERE block_id = ? ORDER BY order_index, id'
      ).all(block.id) as any[];

      console.log(`Block "${block.title}" has ${modules.length} modules`);

      const modulesWithLessons = [];

      for (const mod of modules) {
        const lessons = db.prepare(
          'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index, id'
        ).all(mod.id) as any[];

        console.log(`Module "${mod.title}" has ${lessons.length} lessons`);

        const lessonsWithStatus = lessons.map((lesson: any) => {
          totalLessons++;
          const progress = db.prepare(
            'SELECT * FROM progress WHERE user_id = ? AND lesson_id = ? AND status = ?'
          ).get(session.userId, lesson.id, 'completed');
          if (progress) completedLessons++;
          return { ...lesson, status: progress ? 'completed' : 'available' };
        });

        modulesWithLessons.push({ ...mod, lessons: lessonsWithStatus });
      }

      result.push({ ...block, modules: modulesWithLessons });
    }

    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons,
      completedLessons,
      progressPercent,
      currentLesson: null,
    });
  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

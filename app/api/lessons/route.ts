import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const leaderId = user.role === 'student' ? user.leader_id : user.id;

    // Получаем всё одной структурой
    const blocks = db.prepare(`
      SELECT * FROM blocks 
      WHERE leader_id = ? OR leader_id IS NULL
      ORDER BY order_index
    `).all(leaderId) as any[];

    // Получаем все завершенные уроки пользователя
    const completedProgress = db.prepare(
      'SELECT lesson_id FROM progress WHERE user_id = ? AND status = ?'
    ).all(session.userId, 'completed') as any[];
    
    const completedLessonIds = new Set(completedProgress.map(p => p.lesson_id));

    // Собираем все уроки по порядку
    let allLessonsInOrder: any[] = [];
    
    for (const block of blocks) {
      const modules = db.prepare(
        'SELECT * FROM modules WHERE block_id = ? ORDER BY order_index'
      ).all(block.id) as any[];
      
      for (const mod of modules) {
        const lessons = db.prepare(
          'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index'
        ).all(mod.id) as any[];
        
        lessons.forEach(lesson => {
          allLessonsInOrder.push({
            ...lesson,
            block_id: block.id,
            block_title: block.title,
            module_id: mod.id,
            module_title: mod.title,
          });
        });
      }
    }

    // Определяем статус каждого урока
    let previousCompleted = true; // Первый урок всегда доступен
    const lessonsWithStatus = allLessonsInOrder.map((lesson, index) => {
      const isCompleted = completedLessonIds.has(lesson.id);
      
      let status: 'completed' | 'available' | 'locked';
      if (isCompleted) {
        status = 'completed';
      } else if (index === 0 || previousCompleted) {
        status = 'available';
      } else {
        status = 'locked';
      }
      
      // Обновляем previousCompleted для следующего урока
      previousCompleted = isCompleted;
      
      return {
        ...lesson,
        status,
      };
    });

    // Группируем обратно в структуру
    const result: any[] = [];
    let totalLessons = allLessonsInOrder.length;
    let completedLessons = completedLessonIds.size;

    for (const block of blocks) {
      const modules = db.prepare(
        'SELECT * FROM modules WHERE block_id = ? ORDER BY order_index'
      ).all(block.id) as any[];
      
      const modulesWithLessons = modules.map(mod => {
        const modLessons = lessonsWithStatus.filter(l => l.module_id === mod.id);
        return {
          ...mod,
          lessons: modLessons,
        };
      });
      
      result.push({
        ...block,
        modules: modulesWithLessons,
      });
    }

    const progressPercent = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Текущий урок — первый доступный
    const currentLesson = lessonsWithStatus.find(l => l.status === 'available') || null;

    return NextResponse.json({
      success: true,
      lessons: result,
      totalLessons,
      completedLessons,
      progressPercent,
      currentLesson,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Ошибка при получении уроков' }, { status: 500 });
  }
}

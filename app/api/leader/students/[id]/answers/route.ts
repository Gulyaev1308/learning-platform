import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'leader') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: studentId } = await params;

    // 1. Получаем данные студента для карточки
    const studentResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [studentId]);
    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 });
    }
    const studentObj = studentResult.rows[0];

    // 2. Получаем ответы на опросы
    const result = await db.query(`
      SELECT 
        qa.id,
        qa.answers,
        qa.created_at,
        l.title as lesson_title
      FROM quiz_answers qa
      INNER JOIN lessons l ON l.id = qa.lesson_id
      WHERE qa.user_id = $1
      ORDER BY qa.created_at DESC
    `, [studentId]);

    const answers = result.rows;

    // 3. Формируем заглушку статистики stats, чтобы удовлетворить интерфейс
    const statsObj = {
      total_quizzes: answers.length,
      answered_quizzes: answers.length,
      completion_percent: answers.length > 0 ? 100 : 0
    };

    // 4. ДИНАМИЧЕСКИЙ РАСЧЕТ ТЕКУЩЕЙ БЛОКИРОВКИ ДЛЯ МОДАЛКИ ЛИДЕРА
    const currentLeaderId = session.userId || session.id;
    
    // Получаем всю структуру обучения для анализа лестницы
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

    // Вытягиваем пройденные уроки именно этого студента
    const progressRes = await db.query(
      "SELECT lesson_id FROM progress WHERE user_id = $1 AND status = 'completed'",
      [studentId]
    );
    const completedIds = new Set(progressRes.rows.map(r => r.lesson_id));

    // Вытягиваем уже одобренные доступы этого студента
    const paymentsRes = await db.query(
      "SELECT block_id FROM premium_access WHERE user_id = $1 AND status = 'approved'",
      [studentId]
    );
    const approvedBlockIds = new Set(paymentsRes.rows.map(r => Number(r.block_id)));

    let currentLockedBlockId = null;
    let currentLockedBlockTitle = null;

    // Бежим по лестнице уроков и ищем первый непройденный заблокированный платный блок
    for (const lesson of allLessons) {
      const isCompleted = completedIds.has(lesson.lesson_id);
      const isPremiumBlock = 
        lesson.block_is_premium === true || 
        lesson.block_is_premium === 'true' || 
        lesson.block_is_premium === 1 || 
        String(lesson.block_title).toLowerCase().includes('платный');
      
      const hasLeaderApproved = approvedBlockIds.has(Number(lesson.block_id));

      if (!isCompleted) {
        if (isPremiumBlock && !hasLeaderApproved) {
          currentLockedBlockId = Number(lesson.block_id);
          currentLockedBlockTitle = lesson.block_title;
          break;
        }
      }
    }

    const richStudentObj = {
      ...studentObj,
      current_locked_block_id: currentLockedBlockId,
      current_locked_block_title: currentLockedBlockTitle
    };

    return NextResponse.json({ 
      success: true, 
      student: richStudentObj, 
      stats: statsObj,
      answers: answers 
    });
  } catch (error) {
    console.error('Error fetching student quiz answers:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

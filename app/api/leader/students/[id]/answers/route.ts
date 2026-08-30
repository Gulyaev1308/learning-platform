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

    // ИСПРАВЛЕНО: Возвращаем полную структуру данных QuizAnswersData для фронтенда
    return NextResponse.json({ 
      success: true, 
      student: studentObj, 
      stats: statsObj,
      answers: answers 
    });
  } catch (error) {
    console.error('Error fetching student quiz answers:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;

    // Проверяем, что ученик принадлежит этому лидеру
    const student = db.prepare(
      'SELECT id, name, email FROM users WHERE id = ? AND leader_id = ? AND role = ?'
    ).get(studentId, session.userId, 'student') as any;

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      );
    }

    // Получаем все quiz уроки
    const quizLessons = db.prepare(
      "SELECT id, title, content FROM lessons WHERE type = 'quiz' ORDER BY order_index"
    ).all() as any[];

    // Получаем ответы ученика на опросы
    const answers = db.prepare(`
      SELECT 
        qa.id,
        qa.answer,
        qa.created_at,
        qa.lesson_id,
        l.title as lesson_title
      FROM quiz_answers qa
      INNER JOIN lessons l ON qa.lesson_id = l.id
      WHERE qa.user_id = ?
      ORDER BY qa.created_at DESC
    `).all(studentId) as any[];

    // Формируем ответы с вопросами
    const parsedAnswers = quizLessons.map(quiz => {
      let question = '';
      let options: string[] = [];
      
      try {
        const content = JSON.parse(quiz.content);
        question = content.question || '';
        options = content.options || [];
      } catch {
        question = quiz.content;
      }

      // Ищем ответ ученика на этот опрос
      const studentAnswer = answers.find(a => a.lesson_id === quiz.id);

      return {
        lesson_id: quiz.id,
        lesson_title: quiz.title,
        question,
        options,
        student_answer: studentAnswer?.answer || null,
        answered: !!studentAnswer,
        answered_at: studentAnswer?.created_at || null,
      };
    });

    // Статистика
    const totalQuizzes = quizLessons.length;
    const answeredQuizzes = parsedAnswers.filter(a => a.answered).length;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      stats: {
        total_quizzes: totalQuizzes,
        answered_quizzes: answeredQuizzes,
        completion_percent: totalQuizzes > 0 
          ? Math.round((answeredQuizzes / totalQuizzes) * 100) 
          : 0,
      },
      answers: parsedAnswers,
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении ответов' },
      { status: 500 }
    );
  }
}

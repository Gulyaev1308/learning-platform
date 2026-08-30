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

    const studentResult = await db.query('SELECT id, email, name, role, leader_id FROM users WHERE id = $1', [studentId]);
    const student = studentResult.rows[0]; // ИСПРАВЛЕНО: строго берем объект строки

    if (!student) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 });
    }

    const answersResult = await db.query(`
      SELECT qa.*, l.title as lesson_title 
      FROM quiz_answers qa
      INNER JOIN lessons l ON l.id = qa.lesson_id
      WHERE qa.user_id = $1
    `, [studentId]);

    return NextResponse.json({ 
      success: true, 
      student: { id: student.id, name: student.name, email: student.email }, 
      answers: answersResult.rows 
    });
  } catch (error) {
    console.error('Error fetching student report:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

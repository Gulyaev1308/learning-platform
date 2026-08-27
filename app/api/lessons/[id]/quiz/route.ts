import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { id } = await params;
    const lessonId = parseInt(id);
    const body = await request.json();
    const { answers } = body;

    if (Array.isArray(answers)) {
      for (const answer of answers) {
        db.prepare(
          'INSERT INTO quiz_answers (user_id, lesson_id, answer, free_answer) VALUES (?, ?, ?, ?)'
        ).run(session.userId, lessonId, JSON.stringify(answer), answer.freeAnswer || '');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

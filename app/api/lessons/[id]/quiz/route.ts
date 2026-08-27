import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const { answers } = await request.json();
  
  if (Array.isArray(answers)) {
    for (const answer of answers) {
      await db.query(
        'INSERT INTO quiz_answers (user_id, lesson_id, answer, free_answer) VALUES ($1, $2, $3, $4)',
        [session.userId, id, JSON.stringify(answer), answer.freeAnswer || '']
      );
    }
  }
  
  return NextResponse.json({ success: true });
}

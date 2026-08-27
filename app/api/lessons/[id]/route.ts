import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  
  const result = await db.query('SELECT * FROM lessons WHERE id = $1', [id]);
  const lesson = result.rows[0];
  
  if (!lesson) return NextResponse.json({ error: 'Урок не найден' }, { status: 404 });
  
  const completed = await db.query('SELECT * FROM progress WHERE user_id = $1 AND lesson_id = $2', [session.userId, id]);
  
  return NextResponse.json({
    success: true,
    lesson: { ...lesson, completed: completed.rows.length > 0 },
  });
}

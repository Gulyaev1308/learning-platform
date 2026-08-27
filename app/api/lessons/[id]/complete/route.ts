import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const exists = await db.query('SELECT * FROM progress WHERE user_id = $1 AND lesson_id = $2', [session.userId, id]);
  if (exists.rows.length > 0) return NextResponse.json({ success: true, alreadyCompleted: true });
  await db.query('INSERT INTO progress (user_id, lesson_id, status) VALUES ($1, $2, $3)', [session.userId, id, 'completed']);
  return NextResponse.json({ success: true });
}

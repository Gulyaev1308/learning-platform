import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'leader') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { id } = await params;
  const result = await db.query('SELECT * FROM quiz_answers WHERE user_id = $1 ORDER BY created_at DESC', [id]);
  return NextResponse.json({ success: true, answers: result.rows });
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id: moduleId } = await params;

  const lessons = (await db.query('SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index', [moduleId])).rows as any[];
  return NextResponse.json({ success: true, lessons });
}

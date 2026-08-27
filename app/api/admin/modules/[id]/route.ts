import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id } = await params;
  const { title } = await request.json();

  await db.query('UPDATE modules SET title = $1 WHERE id = $2', [title, id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  const { id } = await params;

  await db.query('DELETE FROM lessons WHERE module_id = $1', [id]);
  await db.query('DELETE FROM modules WHERE id = $1', [id]);

  return NextResponse.json({ success: true });
}

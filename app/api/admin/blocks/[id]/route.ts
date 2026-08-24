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

  db.prepare('UPDATE blocks SET title = ? WHERE id = ?').run(title, id);
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

  // Удаляем связанные модули и уроки
  const modules = db.prepare('SELECT id FROM modules WHERE block_id = ?').all(id) as any[];
  for (const mod of modules) {
    db.prepare('DELETE FROM lessons WHERE module_id = ?').run(mod.id);
  }
  db.prepare('DELETE FROM modules WHERE block_id = ?').run(id);
  db.prepare('DELETE FROM lessons WHERE block_id = ?').run(id);
  db.prepare('DELETE FROM blocks WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}

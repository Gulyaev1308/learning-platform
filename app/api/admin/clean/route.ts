import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM quiz_answers');
    db.exec('DELETE FROM progress');
    db.exec('DELETE FROM lessons');
    db.exec('DELETE FROM modules');
    db.exec('DELETE FROM blocks');
    db.exec("DELETE FROM users WHERE role != 'admin'");
    db.exec('PRAGMA foreign_keys = ON');

    return NextResponse.json({ success: true, message: 'База очищена' });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

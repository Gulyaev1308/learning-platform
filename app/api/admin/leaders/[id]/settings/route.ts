import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: leaderId } = await params;

    let settings = (await db.query('SELECT * FROM leader_settings WHERE leader_id = $1', [leaderId])).rows[0] as any;

    if (!settings) {
      await db.query('INSERT INTO leader_settings (leader_id) VALUES ($1)', [leaderId]);
      settings = (await db.query('SELECT * FROM leader_settings WHERE leader_id = $1', [leaderId])).rows[0] as any;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при получении настроек' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: leaderId } = await params;
    const body = await request.json();
    const { block1_name, block2_name, module1_name, module2_name, lesson_name } = body;

    await db.query(`
      INSERT INTO leader_settings (leader_id, block1_name, block2_name, module1_name, module2_name, lesson_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(leader_id) DO UPDATE SET
        block1_name = excluded.block1_name,
        block2_name = excluded.block2_name,
        module1_name = excluded.module1_name,
        module2_name = excluded.module2_name,
        lesson_name = excluded.lesson_name
    `, [leaderId, block1_name, block2_name, module1_name, module2_name, lesson_name]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при сохранении настроек' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const result = await db.query("SELECT * FROM users WHERE role = 'leader' ORDER BY id");
  return NextResponse.json({ success: true, leaders: result.rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  const { name, email, password } = await request.json();
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'leader') RETURNING id", [email, hash, name]);
  return NextResponse.json({ success: true, leaderId: result.rows[0].id });
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get('id');

    if (!leaderId) {
      return NextResponse.json({ error: 'ID лидера не указан' }, { status: 400 });
    }

    // Начинаем транзакцию, чтобы удаление было атомарным и безопасным
    await db.query('BEGIN');

    // 1. Находим ID всех студентов, привязанных к этому лидеру
    const studentsRes = await db.query('SELECT id FROM users WHERE leader_id = $1 AND role = $2', [leaderId, 'student']);
    const studentIds = studentsRes.rows.map(r => r.id);

    if (studentIds.length > 0) {
      // 2. Удаляем прогресс, ответы и платежи всех студентов лидера
      await db.query('DELETE FROM progress WHERE user_id = ANY($1::integer[])', [studentIds]);
      await db.query('DELETE FROM quiz_answers WHERE user_id = ANY($1::integer[])', [studentIds]);
      await db.query('DELETE FROM premium_access WHERE user_id = ANY($1::integer[])', [studentIds]);
      // 3. Удаляем самих студентов
      await db.query('DELETE FROM users WHERE id = ANY($1::integer[])', [studentIds]);
    }

    // 4. Удаляем личные записи лидера (его аппрувы или данные, если есть)
    await db.query('DELETE FROM premium_access WHERE approved_by = $1', [leaderId]);

    // 5. Удаляем самого лидера
    await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [leaderId, 'leader']);

    await db.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Лидер и вся его структура успешно удалены' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error deleting leader structure:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
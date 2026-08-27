import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для администратора.' },
        { status: 403 }
      );
    }

    const leaders = (await db.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.created_at,
        COUNT(DISTINCT s.id) as students_count
      FROM users u
      LEFT JOIN users s ON s.leader_id = u.id AND s.role = 'student'
      WHERE u.role = 'leader'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)).rows as any[];

    return NextResponse.json({
      success: true,
      leaders,
    });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении лидеров' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только для администратора.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    const existingUser = (await db.query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, name, 'leader');

    return NextResponse.json({
      success: true,
      leaderId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error creating leader:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании лидера' },
      { status: 500 }
    );
  }
}

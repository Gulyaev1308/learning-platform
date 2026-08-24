import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';
import { isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, leaderId } = body;

    // Валидация
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Некорректный email' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть минимум 6 символов' },
        { status: 400 }
      );
    }

    // Проверка существования email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Проверка leader_id если передан
    let leaderIdValue = null;
    if (leaderId) {
      const leader = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(leaderId, 'leader');
      if (!leader) {
        return NextResponse.json(
          { error: 'Указанный лидер не найден' },
          { status: 400 }
        );
      }
      leaderIdValue = leaderId;
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name, role, leader_id) VALUES (?, ?, ?, ?, ?)'
    ).run(email, passwordHash, name, 'student', leaderIdValue);

    const userId = result.lastInsertRowid;

    // Создание сессии
    await createSession({
      userId: Number(userId),
      email,
      name,
      role: 'student',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role: 'student',
        leader_id: leaderIdValue,
      },
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    );
  }
}

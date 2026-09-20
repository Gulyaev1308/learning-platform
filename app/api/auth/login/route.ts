import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // ДЕБАГ ЛОГ 1: Что прислал фронтенд
    console.log(`[AUTH_DEBUG] Попытка входа. Email: "${email}", Длина пароля: ${password ? password.length : 0}`);
    
    const result = await db.query('SELECT * FROM users WHERE email = \$1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      console.warn(`[AUTH_DEBUG] Пользователь с email "${email}" НЕ НАЙДЕН в базе данных PostgreSQL.`);
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }
    
    // ДЕБАГ ЛОГ 2: Что реально лежит в базе данных
    console.log(`[AUTH_DEBUG] Пользователь найден. ID: ${user.id}, Роль: "${user.role}", Имя: "${user.name}"`);
    console.log(`[AUTH_DEBUG] Хэш из БД: "${user.password_hash}", Длина хэша: ${user.password_hash ? user.password_hash.length : 0}`);
    
    // Сравниваем хэш пароля из базы
    const match = await bcrypt.compare(password, user.password_hash);
    
    // ДЕБАГ ЛОГ 3: Результат сравнения bcrypt
    console.log(`[AUTH_DEBUG] Результат сравнения bcrypt.compare(): ${match}`);
    
    if (!match) {
      console.warn(`[AUTH_DEBUG] Пароль не совпал с хэшем для пользователя "${email}".`);
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }
    
    await createSession({ 
      userId: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });
    
    const redirect = user.role === 'leader' ? '/leader' : user.role === 'admin' ? '/admin' : '/dashboard';
    console.log(`[AUTH_DEBUG] Сессия успешно создана. Редирект на: ${redirect}`);
    
    return NextResponse.json({ success: true, redirect });
    
  } catch (e: any) {
    console.error("🚨 КРИТИЧЕСКАЯ ОШИБКА АВТОРИЗАЦИИ:", e.message, e.stack);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
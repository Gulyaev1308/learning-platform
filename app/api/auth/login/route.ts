import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Делаем запрос к PostgreSQL
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // ИСПРАВЛЕНО: Квадратные скобки [0] вместо круглых (0) для получения первой строки!
    const user = result.rows[0];
    
    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }
    
    // Сравниваем хэш пароля из базы
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }
    
    // Создаем сессию
    await createSession({ 
      userId: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });
    
    // Перенаправляем по ролям
    const redirect = user.role === 'leader' ? '/leader' : user.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.json({ success: true, redirect });
    
  } catch (e) {
    // ВАЖНО: Выводим ошибку в консоль сервера, чтобы она не глушилась!
    console.error("🚨 КРИТИЧЕСКАЯ ОШИБКА АВТОРИЗАЦИИ:", e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

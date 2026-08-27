import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    
    await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
    
    const redirect = user.role === 'leader' ? '/leader' : user.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.json({ success: true, redirect });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

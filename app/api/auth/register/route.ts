import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, leaderId } = await request.json();
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return NextResponse.json({ error: 'Email уже существует' }, { status: 400 });
    
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, role, leader_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, hash, name, 'student', leaderId || null]
    );
    
    await createSession({ userId: result.rows[0].id, email, name, role: 'student' });
    return NextResponse.json({ success: true, redirect: '/dashboard' });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

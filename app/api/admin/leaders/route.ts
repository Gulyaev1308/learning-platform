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

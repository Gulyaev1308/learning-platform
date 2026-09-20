import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Очищаем старые неудачные попытки из таблицы users
    await db.query('TRUNCATE TABLE users CASCADE;');

    // 2. Генерируем хэш силами самого бэкенда Next.js
    const passwordHash = await bcrypt.hash('MesaEdTech20261308))', 10);

    // 3. Вставляем чистую запись в PostgreSQL
    await db.query(
      `INSERT INTO users (email, password_hash, name, role, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      ['admin@edtechmlm.ru', passwordHash, 'Главный Администратор', 'admin']
    );

    return NextResponse.json({ 
      success: true, 
      message: "Администратор успешно создан силами бэкенда! Теперь удалите этот роут по соображениям безопасности." 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
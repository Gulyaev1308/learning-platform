import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Сохраняем в PostgreSQL
    const result = await db.query(
      'INSERT INTO videos (filename, data, content_type) VALUES ($1, $2, $3) RETURNING id',
      [file.name, buffer, file.type || 'video/mp4']
    );

    const videoId = result.rows[0].id;

    return NextResponse.json({ 
      success: true, 
      url: `/api/videos/${videoId}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    console.log('Original name:', file.name);

    // Получаем расширение
    const ext = path.extname(file.name) || '.mp4';
    
    // Создаем безопасное имя
    const timestamp = Date.now();
    const safeName = `video_${timestamp}${ext}`;
    
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }

    const filePath = path.join(videosDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log('✅ Saved as:', safeName);

    return NextResponse.json({ 
      success: true, 
      url: `/videos/${safeName}`,
      fileName: safeName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

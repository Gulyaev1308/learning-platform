import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 минут на загрузку

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

    const fileName = file.name.toLowerCase();
    const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json({ error: 'Поддерживаются только видео файлы' }, { status: 400 });
    }

    const videosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeName = fileName.replace(/[^\w\-.]/g, '_');
    const finalName = `${timestamp}_${safeName}`;
    const filePath = path.join(videosDir, finalName);

    // Прямая запись файла
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: `/videos/${finalName}`,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке: ' + (error as Error).message }, { status: 500 });
  }
}

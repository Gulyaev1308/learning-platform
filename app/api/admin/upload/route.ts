import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Пробуем получить JSON с base64
    const body = await request.json();
    const { fileName, fileData, fileType } = body;

    if (!fileName || !fileData) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем расширение
    const validExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const hasValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json({ 
        error: 'Поддерживаются только видео: mp4, webm, mov, avi, mkv' 
      }, { status: 400 });
    }

    // Создаем папку
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    // Уникальное имя
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^\w\-.]/g, '_');
    const finalName = `${timestamp}_${safeName}`;
    const filePath = path.join(videosDir, finalName);

    // Конвертируем base64 в buffer
    const buffer = Buffer.from(fileData, 'base64');
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: `/videos/${finalName}`,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Ошибка при загрузке: ' + (error as Error).message 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

// Инициализация S3 клиента в режиме Virtual-Hosted Style для Cloud.ru
const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: false, // ИСПРАВЛЕНО: переключаем на доменный стиль бакетов (bucket.s3.cloud.ru)
  requestChecksumCalculation: 'WHEN_REQUIRED', 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Сохраняем твою проверку прав авторизации администратора
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { fileName } = await request.json();

    const ext = path.extname(fileName) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    // Передаем Content-Type для строгого соответствия с фронтендом
    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: ext === '.mp4' ? 'video/mp4' : 'application/octet-stream', 
    });

    // Генерирует ссылку вида: https://mesa-edtech-media-bucket.s3.cloud.ru/...
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Ссылка для сохранения в БД в формате Virtual-Hosted
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl, // Сюда фронтенд отправляет видео (метод PUT)
      url: fileViewUrl       // Эту ссылку сохраняй в БД курса
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

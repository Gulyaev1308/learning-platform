import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

// Конфигурация S3 клиента с региональным эндпоинтом Cloud.ru
const s3 = new S3Client({
  region: 'ru-central1', 
  // ИСПРАВЛЕНО: Добавлен регион в поддомен, чтобы балансировщик Cloud.ru корректно обрабатывал OPTIONS
  endpoint: 'https://cloud.ru', 
  forcePathStyle: false, // Оставляем Virtual-Hosted для корректной маршрутизации поддоменов
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

    // Ссылка примет вид: https://cloud.ru...
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Чистая ссылка для записи в БД
    const fileViewUrl = `https://cloud.ru${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl, // Сюда фронтенд отправляет видео (метод PUT)
      url: fileViewUrl       // Эту ссылку сохраняй в БД курса
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

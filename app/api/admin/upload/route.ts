import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

// Инициализация S3 клиента с корректным и доступным в DNS эндпоинтом Cloud.ru
const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', // ИСПРАВЛЕНО: Правильный домен Object Storage
  forcePathStyle: true, // Обязательно для Cloud.ru, чтобы бакет шел в пути URL
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

    // Важно передавать Content-Type, чтобы S3 не ругался на несоответствие сигнатуры при PUT-запросе
    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: ext === '.mp4' ? 'video/mp4' : 'application/octet-stream', 
    });

    // Автоматически генерирует правильный подписанный URL на основе endpoint
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Чистый URL для последующего сохранения в Базу Данных (для просмотра видео учениками)
    const fileViewUrl = `https://s3.cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`; // ИСПРАВЛЕНО

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl, // Сюда фронтенд отправляет видео (метод PUT)
      url: fileViewUrl       // Эту ссылку сохраняй в БД курса
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

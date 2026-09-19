import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', // Базовый официальный эндпоинт Cloud.ru
  forcePathStyle: true, // Включаем обратно path-style, чтобы SDK гарантированно генерировал стабильный URL без багов отрезания поддоменов
  requestChecksumCalculation: 'WHEN_REQUIRED', // Отключаем избыточные контрольные суммы AWS
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { fileName } = await request.json();

    const ext = path.extname(fileName) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: ext === '.mp4' ? 'video/mp4' : 'application/octet-stream', 
    });

    // Генерируем надежную временную ссылку Path-Style: https://cloud.ru...
    const rawUploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // ТРАНСФОРМАЦИЯ В VIRTUAL-HOSTED: Точечно пересобираем ссылку в формат поддомена,
    // который идеально переваривает балансировщик Cloud.ru при OPTIONS-запросах.
    // Превратит в: https://mesa-edtech-media-bucket.s3.cloud.ru/video_...
    const uploadUrl = rawUploadUrl.replace(
      'https://cloud.ru',
      'https://mesa-edtech-media-bucket.s3.cloud.ru'
    );
    
    // Ссылка для сохранения в БД для просмотра учениками
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl, // Идеальная ссылка для фронтенда (метод PUT)
      url: fileViewUrl       
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

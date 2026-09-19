import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', // Базовый эндпоинт Cloud.ru
  forcePathStyle: true,            // ВОЗВРАЩАЕМ TRUE: Cloud.ru работает через path-style URL
  requestChecksumCalculation: 'WHEN_REQUIRED', 
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

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: contentType, 
    });

    // Генерируем ссылку со специальным флагом для CORS-совместимости Cloud.ru
    const uploadUrl = await getSignedUrl(s3, command, { 
      expiresIn: 3600,
      // КРИТИЧЕСКИ ВАЖНО ДЛЯ CLOUD.RU: Говорим SDK не подписывать кастомные заголовки для preflight-запроса OPTIONS. 
      // Это предотвратит ошибку 400 Bad Request от балансировщика Cloud.ru.
      signableHeaders: new Set([]), 
    });
    
    // Публичная ссылка для сохранения в БД
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl,     // Будет иметь стабильный вид: https://cloud.ru...
      contentType: contentType, 
      url: fileViewUrl       
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

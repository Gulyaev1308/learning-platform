import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', 
  // ИСПРАВЛЕНО: Отключаем forcePathStyle. SDK автоматически создаст правильный 
  // Virtual-Hosted URL (с бакетом в поддомене), который требует Cloud.ru для OPTIONS/CORS
  forcePathStyle: false, 
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

    // Явно определяем тип контента, чтобы зафиксировать его для подписи
    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: contentType, 
    });

    // Генерируем ссылку. Из-за forcePathStyle: false она сразу будет иметь вид:
    // https://mesa-edtech-media-bucket.s3.cloud.ru/video_...
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // ИСПРАВЛЕНО: Корректная публичная ссылка для сохранения в базу данных
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl,   // Готовая ссылка для фронтенда
      contentType: contentType, // Передаем тип на фронтенд для точного совпадения заголовков
      url: fileViewUrl       
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

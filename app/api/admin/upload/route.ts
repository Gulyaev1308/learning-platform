import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1-a', // Регион для Cloud.ru Evolution
  endpoint: 'https://cloud.ru', 
  forcePathStyle: true, // Обязательно для Evolution
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

    // Читаем только имя и тип файла (сам файл весом 1 ГБ сервер не принимает!)
    const { filename, filetype } = await request.json();

    const ext = path.extname(filename) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: uniqueFileName,
      ContentType: filetype || 'video/mp4',
    });

    // Генерируем стандартную пресайнед-ссылку (принимает строго expiresIn)
    const rawUploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // ЖЕЛЕЗОБЕТОННЫЙ ПАТЧ ДЛЯ СОВМЕСТИМОСТИ С CLOUD.RU EVOLUTION:
    // 1. Принудительно заменяем базовый домен cloud.ru на s3.cloud.ru
    // 2. Полностью вырезаем параметры чексумм (crc32), которые ломают CORS на стороне Cloud.ru
    const cleanUploadUrl = rawUploadUrl
      .replace('https://cloud.ru', 'https://cloud.ru')
      .replace(/&x-amz-checksum-[^&]*/g, '')
      .replace(/&x-amz-sdk-checksum-[^&]*/g, '');

    return NextResponse.json({
      success: true,
      uploadUrl: cleanUploadUrl, // Чистая, рабочая ссылка-пропуск для фронтенда
      url: `https://cloud.ru/${process.env.S3_BUCKET_NAME}/${uniqueFileName}` // Ссылка для сохранения в БД уроков
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

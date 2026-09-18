import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: true, // КАН ОН: Возвращаем Path-Style (адрес начнется строго с s3.cloud.ru)
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

    const { filename, filetype } = await request.json();

    const ext = path.extname(filename) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: uniqueFileName,
      ContentType: filetype || 'video/mp4',
    });

    // Генерируем сырую ссылку штатными средствами без кастомных аргументов
    const rawUploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // ИНЖЕНЕРНЫЙ ПАТЧ СОВМЕСТИМОСТИ С EVOLUTION S3:
    // 1. Гарантируем правильный эндпоинт s3.cloud.ru, если SDK попытался его сбросить
    // 2. Полностью вырезаем параметры чексумм и x-id, которые вызывают 400 Bad Request
    const cleanUploadUrl = rawUploadUrl
      .replace('https://cloud.ru', 'https://s3.cloud.ru')
      .replace(/&x-amz-checksum-[^&]*/g, '')
      .replace(/&x-amz-sdk-checksum-[^&]*/g, '')
      .replace(/&x-id=[^&]*/g, ''); 

    return NextResponse.json({
      success: true,
      uploadUrl: cleanUploadUrl, // Отдаем фронтенду чистую ссылку на s3.cloud.ru без лишнего мусора
      url: `https://cloud.ru{process.env.S3_BUCKET_NAME}/${uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: true, 
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

    // Принимаем параметры с фронтенда с соблюдением CamelCase
    const { fileName, fileType } = await request.json();

    const ext = path.extname(fileName) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    // Передаем ContentType, чтобы AWS SDK добавил его в расчет подписи ссылки
    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: fileType || 'video/mp4', 
    });

    const rawUploadUrl = await getSignedUrl(s3, command, { 
      expiresIn: 3600,
      signableHeaders: new Set(['host', 'content-type']) // Хак для Cloud.ru Evolution, принудительно подписываем Content-Type
    });

    // Чистим ссылку от лишних чексумм
    const cleanUploadUrl = rawUploadUrl
      .replace('https://cloud.ru', 'https://s3.cloud.ru')
      .replace(/&x-amz-checksum-[^&]*/g, '')
      .replace(/&x-amz-sdk-checksum-[^&]*/g, '')
      .replace(/&x-id=[^&]*/g, ''); 

    return NextResponse.json({
      success: true,
      uploadUrl: cleanUploadUrl,
      // Исправлена синтаксическая ошибка генерации финального URL
      url: `https://cloud.ru{uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

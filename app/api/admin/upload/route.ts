import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://cloud.ru',
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

    // Принимаем от фронтенда только имя и тип файла (сам тяжелый файл не шлем!)
    const { filename, filetype } = await request.json();

    const ext = path.extname(filename) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: uniqueFileName,
      ContentType: filetype || 'video/mp4',
    });

    // Генерируем безопасный пропуск для загрузки, действующий 60 минут
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Возвращаем фронтенду ссылку для загрузки И итоговый URL, который запишется в базу
    return NextResponse.json({
      success: true,
      uploadUrl, // Сюда фронтенд загрузит файл напрямую
      url: `/api/videos/${uniqueFileName}` // Это пойдет в базу данных курсов
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка генерации S3: ' + (error as Error).message }, { status: 500 });
  }
}

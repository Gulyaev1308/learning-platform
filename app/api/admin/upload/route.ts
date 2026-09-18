import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://cloud.ru', 
  forcePathStyle: true, // Правило для Evolution
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

    // Генерируем пропуск для прямой загрузки со сроком действия 1 час
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      uploadUrl, // Ссылка-пропуск для загрузки с вашего ПК напрямую в Сбер
      url: `https://cloud.ru/${process.env.S3_BUCKET_NAME}/${uniqueFileName}` // Ссылка, которая пойдет в базу данных уроков
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

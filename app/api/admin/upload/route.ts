import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
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

    // Читаем имя файла из кастомного заголовка, который передаст фронтенд
    const rawFilename = request.headers.get('x-filename') || 'video.mp4';
    const contentType = request.headers.get('content-type') || 'video/mp4';

    const ext = path.extname(rawFilename) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    if (!request.body) {
      return NextResponse.json({ error: 'Пустой файл' }, { status: 400 });
    }

    // Конвертируем веб-поток в стандартный поток Node.js
    const nodeStream = Readable.fromWeb(request.body as any);

    // Потоковый менеджер загрузки в S3 (потребляет фиксированные 10 МБ ОЗУ)
    const parallelUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.S3_BUCKET_NAME || '',
        Key: uniqueFileName,
        Body: nodeStream,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 10, // Части по 10 МБ
      leavePartsOnError: false,
    });

    await parallelUpload.done();
    console.log('Потоковая бинарная загрузка в S3 завершена:', uniqueFileName);

    return NextResponse.json({
      success: true,
      url: `https://cloud.ru{process.env.S3_BUCKET_NAME}/${uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера S3: ' + (error as Error).message }, { status: 500 });
  }
}

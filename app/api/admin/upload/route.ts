import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import { getSession } from '@/lib/auth';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

// POST-метод: Принимает бинарный поток файла транзитом без расхода памяти сервера
export async function POST(request: NextRequest) {
  console.log(`=== [SERVER LOG: Сквозной поток запущен] ===`);

  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const encodedFileName = request.headers.get('x-file-name');
    if (!encodedFileName) {
      return NextResponse.json({ error: 'Заголовок x-file-name обязателен' }, { status: 400 });
    }
    const fileName = decodeURIComponent(encodedFileName);

    if (!request.body) {
      return NextResponse.json({ error: 'Тело запроса пустое' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = request.headers.get('content-type') || 'video/mp4';

    // Конвертируем ReadableStream веб-стандарта в Node.js Readable stream
    const nodeStream = Readable.fromWeb(request.body as any);

    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: uniqueFileName,
        Body: nodeStream,
        ContentType: contentType,
      },
      queueSize: 2,
      partSize: 1024 * 1024 * 10, // В оперативной памяти единовременно держится только 10 МБ файла
      leavePartsOnError: false,   // Если клиент оборвет соединение — S3 сам вычистит недогруженные части
    });

    await parallelUploads3.done();

    console.log(`=== [SERVER LOG: УСПЕШНО ЗАПИСАНО В S3] ===`);
    const fileViewUrl = `https://cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`;

    return NextResponse.json({ success: true, url: fileViewUrl });
  } catch (error) {
    console.error('Критическая ошибка стрима в App Router:', error);
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

// DELETE-метод: Удаляет файл из S3, если пользователь закрыл форму без сохранения уроков
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { fileUrl } = await request.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'Укажите fileUrl' }, { status: 400 });
    }

    const key = fileUrl.split('/').pop();

    await s3.send(new DeleteObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: key,
    }));

    console.log(`[SERVER CLEANUP] Несохраненный файл ${key} успешно удален из S3`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

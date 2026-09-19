import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import { getSession } from '@/lib/auth';

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

export async function POST(request: NextRequest) {
  console.log(`=== [SERVER LOG: Запущен низкоуровневый сквозной стриминг сокета] ===`);

  try {
    // 1. Проверка сессии (работает без ошибок контекста кук в App Router)
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const encodedFileName = request.headers.get('x-file-name');
    if (!encodedFileName) {
      return NextResponse.json({ error: 'Заголовок x-file-name обязателен' }, { status: 400 });
    }
    const fileName = decodeURIComponent(encodedFileName);

    // 2. ИСПРАВЛЕНО: Извлекаем оригинальный сырой поток Node.js (IncomingMessage) из скрытого символа Next.js.
    // Это полностью отключает внутреннюю буферизацию Next.js в оперативную память.
    // @ts-ignore
    const kRawRequest = Object.getOwnPropertySymbols(request).find(s => s.description === 'request body stream');
    // @ts-ignore
    const rawNodeStream = request[kRawRequest]?.shortCircuit() || request.body;

    if (!rawNodeStream) {
      return NextResponse.json({ error: 'Не удалось инициализировать поток сокета' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = request.headers.get('content-type') || 'video/mp4';

    // 3. Отправляем сырой поток напрямую в Cloud.ru Evolution S3
    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: uniqueFileName,
        Body: rawNodeStream, // Сырой Node stream летит транзитом со скоростью сети
        ContentType: contentType,
      },
      queueSize: 1, // Ограничиваем очередь до 1 для максимальной экономии RAM
      partSize: 1024 * 1024 * 8, // Держим в буфере строго по 8 МБ данных
      leavePartsOnError: false, // При отмене на фронтенде S3 автоматически очистит незавершенные чанки
    });

    await parallelUploads3.done();

    console.log(`=== [SERVER LOG: УСПЕШНО ЗАПИСАНО В S3] ===`);
    const fileViewUrl = `https://cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`;

    return NextResponse.json({ success: true, url: fileViewUrl });
  } catch (error) {
    console.error('Критическая ошибка низкоуровневого стрима:', error);
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

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

import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import Busboy from 'busboy';
import path from 'path';
import { getSession } from '@/lib/auth';

// Инициализируем клиент S3 Cloud.ru Evolution
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
    // 1. Проверяем сессию администратора
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // 2. Получаем заголовки для инициализации Busboy
    const contentType = request.headers.get('content-type');
    if (!contentType) {
      return NextResponse.json({ error: 'Missing Content-Type' }, { status: 400 });
    }

    // 3. Конвертируем Web Stream от Next.js в стандартный Node.js Readable Stream
    if (!request.body) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }
    const nodeStream = Readable.fromWeb(request.body as any);

    const busboy = Busboy({ headers: { 'content-type': contentType } });

    // Это обещание (Promise) завершится, когда файл полностью перекачается в S3
    const uploadPromise = new Promise<{ success: boolean; url: string }>((resolve, reject) => {
      busboy.on('file', (name, fileStream, info) => {
        const { filename, mimeType } = info;
        const ext = path.extname(filename) || '.mp4';
        const fileName = `video_${Date.now()}${ext}`;

        // Используем профессиональный менеджер загрузки потоков в S3
        const parallelUpload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.S3_BUCKET_NAME || '',
            Key: fileName,
            Body: fileStream, // Передаем поток напрямую! В RAM ничего не копируется
            ContentType: mimeType || 'video/mp4',
          },
          queueSize: 4, // Количество одновременных потоков загрузки частей
          partSize: 1024 * 1024 * 10, // Размер одной части — 10 МБ (потребление RAM минимально)
          leavePartsOnError: false,
        });

        parallelUpload.done()
          .then(() => {
            console.log('Потоковая загрузка в S3 завершена:', fileName);
            resolve({ success: true, url: `/api/videos/${fileName}` });
          })
          .catch((err) => {
            console.error('Ошибка при стриминге в S3:', err);
            reject(err);
          });
      });

      busboy.on('error', (err) => reject(err));
    });

    // Пускаем поток данных через парсер Busboy
    nodeStream.pipe(busboy);

    const result = await uploadPromise;
    
    // Возвращаем абсолютно стандартный ответ, фронтенд счастлив и ничего не замечает
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка потока S3: ' + (error as Error).message }, { status: 500 });
  }
}

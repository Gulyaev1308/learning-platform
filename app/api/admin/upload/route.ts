import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage'; // Вернули ваш рабочий менеджер загрузки
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', // Оставляем ваш исходный рабочий хост
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  console.log(`=== [SERVER BACKEND LOG: Получен чанк запроса] ===`);
  
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Читаем параметры из заголовков фронтенда
    const key = request.headers.get('x-file-key');
    const partNumber = request.headers.get('x-part-number');

    if (!key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены заголовки параметров файла' }, { status: 400 });
    }

    // ЛОКАЛЬНО: Превращаем тело запроса Next.js в чистый Node.js Stream
    // Это исключает использование request.formData() и не забивает память
    const chunkStream = request.body; 
    if (!chunkStream) {
      return NextResponse.json({ error: 'Тело чанка пустое' }, { status: 400 });
    }

    const chunkKey = `${key}.part${partNumber}`;

    // Используем проверенный класс Upload, который не вызывает 404 на Cloud.ru
    const s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: chunkKey,
        Body: chunkStream, // Передаем поток напрямую в S3
        ContentType: 'application/octet-stream',
      },
    });

    await s3Upload.done();
    console.log(`[SERVER BACKEND] Чанк ${partNumber} успешно обработан через Upload и сохранен.`);

    return NextResponse.json({
      success: true,
      partKey: chunkKey,
      partNumber: parseInt(partNumber, 10)
    });
  } catch (error) {
    console.error('=== [SERVER CRITICAL ERROR] ===');
    console.error(error);
    return NextResponse.json({ error: 'S3 Upload Error: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage'; // Проверенный встроенный менеджер
import path from 'path';
import { getSession } from '@/lib/auth';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', // Ваш оригинальный рабочий хост
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

    // Читаем имя файла из кастомного заголовка
    const encodedFileName = request.headers.get('x-file-name');
    if (!encodedFileName) {
      return NextResponse.json({ error: 'Заголовок x-file-name обязателен' }, { status: 400 });
    }
    const fileName = decodeURIComponent(encodedFileName);

    if (!request.body) {
      return NextResponse.json({ error: 'Тело запроса пустое' }, { status: 400 });
    }

    console.log(`=== [SERVER LOG: START STREAM UPLOAD] ===`);
    console.log(`Файл: ${fileName}`);

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = request.headers.get('content-type') || 'video/mp4';

    // Конвертируем Web ReadableStream в Node.js Readable stream для S3 SDK
    // Это исключает буферизацию в RAM: файл транзитом летит в S3
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
      partSize: 1024 * 1024 * 10, // Размер внутреннего буфера — 10 MB
      leavePartsOnError: false, 
    });

    await parallelUploads3.done();
    
    console.log(`=== [SERVER LOG: SUCCESS] ===`);
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: fileViewUrl       
    });

  } catch (error) {
    console.error('Критическая ошибка при стриминге в Cloud.ru:', error);
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

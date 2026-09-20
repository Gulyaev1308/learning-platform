import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', 
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = 'mesa-edtech-media-bucket';

// Вспомогательная функция для перевода потока S3 в Uint8Array (Next.js Response)
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  
  try {
    console.log(`[VIDEO_PROXY_START] Студент запросил воспроизведение файла: ${fileName}`);

    // 1. Формируем запрос к Cloud.ru Object Storage
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const s3Response = await s3.send(command);
    
    if (!s3Response.Body) {
      console.error(`[VIDEO_PROXY_ERROR] Пустое тело ответа S3 для файла: ${fileName}`);
      return NextResponse.json({ error: 'Контент файла пуст' }, { status: 404 });
    }

    // Получаем полный размер файла из метаданных S3
    const totalLength = s3Response.ContentLength || 0;
    
    // Преобразуем поток из S3 в буфер для нарезки чанков
    const buffer = await streamToBuffer(s3Response.Body as Readable);
    const uint8Array = new Uint8Array(buffer);

    const rangeHeader = request.headers.get('range');

    // 2. Обработка стриминга частями (для перемотки в плеере)
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      
      const chunk = uint8Array.slice(start, end + 1);

      console.log(`[VIDEO_PROXY_STREAM] Отдача чанка для ${fileName}: bytes ${start}-${end}/${totalLength}`);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': s3Response.ContentType || 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': (end - start + 1).toString(),
        },
      });
    }

    // 3. Отдача файла целиком (если плеер не запросил range)
    console.log(`[VIDEO_PROXY_SUCCESS] Отдача файла целиком: ${fileName}, размер: ${totalLength} байт`);
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': s3Response.ContentType || 'video/mp4',
        'Content-Length': totalLength.toString(),
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error: any) {
    // Точечное перехватывание ошибки отсутствия файла в S3
    if (error.name === 'NoSuchKey') {
      console.error(`[VIDEO_PROXY_404] Файл не найден в бакете Cloud.ru: ${fileName}`);
      return NextResponse.json({ error: 'Видеофайл не найден в облачном хранилище' }, { status: 404 });
    }

    console.error(`[VIDEO_PROXY_CRITICAL] Ошибка проксирования видео ${fileName}:`, error.message, error.stack);
    return NextResponse.json({ error: 'Ошибка сервера при чтении из S3' }, { status: 500 });
  }
}

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

// Вспомогательный хелпер для безопасного сбора потока в Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  const decodedKey = decodeURIComponent(fileName);
  
  try {
    console.log(`[VIDEO_PROXY_START] Запрос файла из Cloud.ru S3: "${decodedKey}"`);

    // ИСПРАВЛЕНО ТОЧЕЧНО: Запрашиваем файл целиком без проброса Range в S3, чтобы исключить XML parse error
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: decodedKey,
    });

    const s3Response = await s3.send(command);
    
    if (!s3Response.Body) {
      return NextResponse.json({ error: 'Файл пуст' }, { status: 404 });
    }

    const buffer = await streamToBuffer(s3Response.Body as Readable);
    const totalLength = buffer.length;

    const rangeHeader = request.headers.get('range');
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', s3Response.ContentType || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');

    // Нарезаем чанки для плеера на стороне бэкенда Next.js
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      
      const chunk = buffer.subarray(start, end + 1);

      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${totalLength}`);
      responseHeaders.set('Content-Length', chunk.length.toString());

      console.log(`[VIDEO_PROXY_STREAM_OK] Отдан чанк бэкендом: bytes ${start}-${end}/${totalLength}`);
      
      // ИСПРАВЛЕНИЕ ОШИБКИ ТИПОВ: Оборачиваем Uint8Array в нативный Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(chunk));
          controller.close();
        }
      });

      return new NextResponse(webStream as any, {
        status: 206,
        headers: responseHeaders,
      });
    }

    // Если Range нет, отдаем файл целиком
    responseHeaders.set('Content-Length', totalLength.toString());
    console.log(`[VIDEO_PROXY_FULL_OK] Отдан полный файл бэкендом, размер: ${totalLength} байт`);
    
    const fullWebStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      }
    });

    return new NextResponse(fullWebStream as any, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error(`[VIDEO_PROXY_CRITICAL] Критический сбой роута видео для ${decodedKey}:`, error.message);
    if (error.name === 'NoSuchKey' || error.code === 'NoSuchKey') {
      return NextResponse.json({ error: 'Файл не найден в S3' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка сервера при чтении видеопотока' }, { status: 500 });
  }
}

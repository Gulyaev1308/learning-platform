import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSession } from '@/lib/auth';

// Жесткая каноническая конфигурация под S3 Cloud.ru Evolution
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
  console.log(`=== [SERVER BACKEND LOG: Получен FormData чанк Evolution] ===`);
  
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const key = formData.get('key') as string;
    const partNumber = formData.get('partNumber') as string;

    if (!chunk || !key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены параметры FormData' }, { status: 400 });
    }

    // Читаем массив байт чанка напрямую в буфер Node.js
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[SERVER BACKEND] Размер буфера для отправки в Evolution: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    const chunkKey = `${key}.part${partNumber}`;

    // Передаем в S3 чистый Buffer
    const s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: chunkKey,
        Body: buffer, 
        ContentType: 'application/octet-stream',
      },
    });

    await s3Upload.done();
    console.log(`[SERVER BACKEND] Чанк ${partNumber} успешно сохранен в Evolution S3.`);

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

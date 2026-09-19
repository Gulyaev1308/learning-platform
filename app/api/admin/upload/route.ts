import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSession } from '@/lib/auth';

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
  console.log(`=== [SERVER BACKEND LOG: Получен легитимный FormData чанк] ===`);
  
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // ВАЖНО: используем встроенный в Next.js парсер FormData ТОЛЬКО для маленького чанка (15МБ)
    // Для 15 МБ это абсолютно безопасно и не вызывает Out of Memory!
    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const key = formData.get('key') as string;
    const partNumber = formData.get('partNumber') as string;

    if (!chunk || !key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены параметры FormData' }, { status: 400 });
    }

    const chunkKey = `${key}.part${partNumber}`;

    // Передаем поток чанка в стабильный Upload
    const s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: chunkKey,
        Body: chunk.stream(), 
        ContentType: 'application/octet-stream',
      },
    });

    await s3Upload.done();
    console.log(`[SERVER BACKEND] Чанк ${partNumber} успешно пропущен WAF и сохранен.`);

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

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export async function GET() {
  return NextResponse.json({ message: "Ready" });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Читаем параметры из заголовков (это исключает баги парсинга FormData)
    const key = request.headers.get('x-file-key');
    const partNumber = request.headers.get('x-part-number');

    if (!key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены заголовки x-file-key или x-part-number' }, { status: 400 });
    }

    // Получаем чистый бинарный буфер напрямую из тела запроса
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const chunkKey = `${key}.part${partNumber}`;

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: chunkKey,
      Body: buffer,
      ContentType: 'application/octet-stream',
    });

    await s3.send(command);

    return NextResponse.json({
      success: true,
      partKey: chunkKey,
      partNumber: parseInt(partNumber, 10)
    });
  } catch (error) {
    console.error('Критическая ошибка S3:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

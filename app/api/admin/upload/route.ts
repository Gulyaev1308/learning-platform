import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

// Используем точный S3 эндпоинт Cloud.ru
const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', 
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

// Отключаем GET-запрос, так как Cloud.ru S3 отклоняет ручную инициализацию без спец-прав
export async function GET() {
  return NextResponse.json({ message: "Use POST for chunk upload" });
}

// POST-запрос: Принимает чанк и сразу транслирует его в S3 без накопления в RAM
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Пропущены параметры чанка' }, { status: 400 });
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Уникальный ключ для каждого чанка на диске S3 (например: video_123.mp4.part1)
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
    console.error('Ошибка загрузки чанка:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

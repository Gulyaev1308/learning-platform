import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://s3.cloud.ru', 
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

    const { fileName } = await request.json();

    const ext = path.extname(fileName) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
    });

    const rawUploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // БЕЗОПАСНАЯ ОЧИСТКА ССЫЛКИ ЧЕРЕЗ ОБЪЕКТ URL
    const urlObj = new URL(rawUploadUrl);
    
    // Меняем хост на правильный S3 эндпоинт
    urlObj.hostname = 's3.cloud.ru';
    
    // Жестко удаляем чексуммы, которые вешают OPTIONS-запрос в Cloud.ru
    urlObj.searchParams.delete('x-amz-checksum-crc32');
    urlObj.searchParams.delete('x-amz-sdk-checksum-algorithm');
    urlObj.searchParams.delete('x-id'); // Очищаем x-id=PutObject, так как метод PUT и так понятен

    return NextResponse.json({
      success: true,
      uploadUrl: urlObj.toString(),
      url: `https://cloud.ru{uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

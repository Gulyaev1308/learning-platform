import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const fileName = request.nextUrl.searchParams.get('fileName');
    if (!fileName) {
      return NextResponse.json({ error: 'Имя файла обязательно' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: 'video/mp4',
    });

    // Генерируем ссылку, которая действительна 1 час (3600 секунд)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Итоговый публичный URL файла после успешной загрузки
    const fileViewUrl = `https://cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl: fileViewUrl,
    });
  } catch (error) {
    console.error('Ошибка генерации Presigned URL:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

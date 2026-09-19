import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1',             // Строгий регион для Cloud.ru
  endpoint: 'https://s3.cloud.ru',     // Официальный эндпоинт хранилища
  forcePathStyle: true,               // Использование структуры path-style запросов
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
    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: contentType,
    });

    // Генерируем ссылку без вмешательства автоматических подмен хоста со стороны SDK
    const uploadUrl = await getSignedUrl(s3, command, { 
      expiresIn: 3600,
    });
    
    // Публичная ссылка для сохранения в базу данных
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl,     // Ссылка примет верный вид: https://s3.cloud.ru/mesa-edtech-media-bucket/...
      contentType: contentType, 
      url: fileViewUrl       
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  // КРИТИЧЕСКИЙ ЖЕСТКИЙ ФИКС ДЛЯ EVOLUTION S3:
  region: 'ru-central1', // Строго ru-central1-a, никаких ru-central1!
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: true, // Строго true, чтобы ссылка была s3.cloud.ru/bucket
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

    const { filename, filetype } = await request.json();

    const ext = path.extname(filename) || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: uniqueFileName,
    });

    const rawUploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Чистим ссылку от мусора чексумм и x-id, которые Evolution тоже не любит
    const cleanUploadUrl = rawUploadUrl
      .replace('https://cloud.ru', 'https://s3.cloud.ru')
      .replace(/&x-amz-checksum-[^&]*/g, '')
      .replace(/&x-amz-sdk-checksum-[^&]*/g, '')
      .replace(/&x-id=[^&]*/g, ''); 

    return NextResponse.json({
      success: true,
      uploadUrl: cleanUploadUrl,
      url: `https://cloud.ru{process.env.S3_BUCKET_NAME}/${uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

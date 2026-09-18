import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central1', 
  endpoint: 'https://cloud.ru', 
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

    return NextResponse.json({
      success: true,
      uploadUrl: rawUploadUrl,
      url: `https://cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

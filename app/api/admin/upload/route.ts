import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand 
} from '@aws-sdk/client-s3';
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

    const { action, fileName, uploadId, partNumber, chunk, parts } = await request.json();
    const Bucket = 'mesa-edtech-media-bucket';

    // 1. Инициализация загрузки
    if (action === 'start') {
      const ext = path.extname(fileName) || '.mp4';
      const uniqueFileName = `video_${Date.now()}${ext}`;
      
      const command = new CreateMultipartUploadCommand({
        Bucket,
        Key: uniqueFileName,
        ContentType: 'video/mp4'
      });
      const res = await s3.send(command);
      
      return NextResponse.json({ uploadId: res.UploadId, key: uniqueFileName });
    }

    // 2. Загрузка отдельной части (чанга)
    if (action === 'upload') {
      const buffer = Buffer.from(chunk, 'base64');
      const command = new UploadPartCommand({
        Bucket,
        Key: fileName,
        UploadId: uploadId,
        PartNumber: Number(partNumber),
        Body: buffer
      });
      const res = await s3.send(command);
      return NextResponse.json({ ETag: res.ETag });
    }

    // 3. Завершение загрузки и склейка файла
    if (action === 'complete') {
      const command = new CompleteMultipartUploadCommand({
        Bucket,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
      });
      await s3.send(command);
      return NextResponse.json({
        success: true,
        url: `https://cloud.ru{Bucket}/${fileName}`
      });
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'S3 Error: ' + (error as Error).message }, { status: 500 });
  }
}

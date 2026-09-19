import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru', // Исправили эндпоинт на s3.cloud.ru как в основном роуте
  forcePathStyle: true,
  credentials: { 
    accessKeyId: process.env.S3_ACCESS_KEY || '', 
    secretAccessKey: process.env.S3_SECRET_KEY || '' 
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { uploadId, key, parts } = await request.json();
    
    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return NextResponse.json({ error: 'Неверные данные для завершения загрузки' }, { status: 400 });
    }

    // Сортируем части по возрастанию (требование AWS S3)
    const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sortedParts },
    });

    await s3.send(command);

    const fileViewUrl = `https://cloud.ru/mesa-edtech-media-bucket/${key}`;

    return NextResponse.json({ 
      success: true,
      url: fileViewUrl 
    });
  } catch (error) {
    console.error('Ошибка склейки файла в S3:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

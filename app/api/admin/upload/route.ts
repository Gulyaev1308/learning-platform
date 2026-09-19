import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
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

// GET-запрос: Инициализация загрузки (получаем UploadId от S3)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    if (!fileName) {
      return NextResponse.json({ error: 'Имя файла обязательно' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: ext === '.mp4' ? 'video/mp4' : 'application/octet-stream',
    });

    const response = await s3.send(command);

    return NextResponse.json({
      uploadId: response.UploadId,
      key: uniqueFileName,
    });
  } catch (error) {
    console.error('Ошибка инициализации S3 Multipart:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST-запрос: Принимает ОДИН маленький чанк файла и сразу шлет его в S3 (память не раздувается)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const uploadId = formData.get('uploadId') as string;
    const key = formData.get('key') as string;
    const partNumber = parseInt(formData.get('partNumber') as string, 10);

    if (!chunk || !uploadId || !key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены обязательные параметры чанка' }, { status: 400 });
    }

    // Переводим Blob чанка в Buffer для AWS SDK
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new UploadPartCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    });

    const response = await s3.send(command);

    // Возвращаем фронтенду ETag чанка — он критически важен для сборки в конце!
    return NextResponse.json({
      PartNumber: partNumber,
      ETag: response.ETag,
    });
  } catch (error) {
    console.error(`Ошибка загрузки чанка #${request.headers.get('part-number')}:`, error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

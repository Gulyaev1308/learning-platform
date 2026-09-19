import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { fileName, fileSize } = await request.json();
    
    if (!fileName || !fileSize) {
      return NextResponse.json({ error: 'fileName и fileSize обязательны' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    
    // ИСПРАВЛЕНО: Жёстко фиксируем валидный MIME-тип. 
    // Cloud.ru сбрасывает Multipart сессию в 500, если тип некорректный.
    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

    // 1. Инициализируем сессию многокомпонентной загрузки
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: uniqueFileName,
      ContentType: contentType, // Важнейший заголовок для Cloud.ru
    });
    
    const { UploadId } = await s3.send(createCommand);

    if (!UploadId) {
      throw new Error('Не удалось получить сессию загрузки (UploadId) от Cloud.ru');
    }

    // Устанавливаем размер чанка 10 МБ
    const PART_SIZE = 10 * 1024 * 1024; 
    const totalParts = Math.ceil(fileSize / PART_SIZE);
    const urls: string[] = [];

    // 2. Генерируем подписанную PUT-ссылку для каждого отдельного чанка
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const partCommand = new UploadPartCommand({
        Bucket: 'mesa-edtech-media-bucket',
        Key: uniqueFileName,
        UploadId: UploadId,
        PartNumber: partNumber,
      });
      // Подписываем только URL, Cloud.ru сам сопоставит чанки по номеру
      const url = await getSignedUrl(s3, partCommand, { expiresIn: 3600 });
      urls.push(url);
    }

    const fileViewUrl = `https://cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      uploadId: UploadId,
      key: uniqueFileName,
      urls: urls,
      partSize: PART_SIZE,
      url: fileViewUrl
    });

  } catch (error) {
    console.error('Ошибка на бэкенде S3:', error);
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

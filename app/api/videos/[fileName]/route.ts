import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', 
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = 'mesa-edtech-media-bucket';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  const decodedKey = decodeURIComponent(fileName);
  
  try {
    console.log(`[VIDEO_REDIRECT_START] Запрос безопасной ссылки для файла: "${decodedKey}"`);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: decodedKey,
    });

    // ТОЧЕЧНЫЙ ФИКС: Генерируем временную подписанную ссылку на 1 час (3600 секунд)
    // Это полностью исключает @aws-sdk XML parse error на бэкенде!
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    console.log(`[VIDEO_REDIRECT_SUCCESS] Ссылка успешно создана. Выполняем 302 Редирект на поток Cloud.ru`);

    // Делаем временный HTTP 302 редирект видеоплеера на реальный поток из Object Storage
    return NextResponse.redirect(signedUrl, { status: 302 });

  } catch (error: any) {
    console.error(`[VIDEO_REDIRECT_CRITICAL] Критическая ошибка роута видео для ${decodedKey}:`, error.message);
    return NextResponse.json({ error: 'Внутренняя ошибка авторизации медиапотока' }, { status: 500 });
  }
}

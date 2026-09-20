import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Синхронизируем конфигурацию со стандартом Cloud.ru Evolution
const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://s3.cloud.ru', 
  bucketEndpoint: false,
  forcePathStyle: true, // Включаем Path Style формат ссылок
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

    // Генерируем временную подписанную ссылку на 1 час
    let signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // ИСПРАВЛЕНИЕ: Предотвращаем баг удаления поддомена s3 со стороны AWS SDK
    if (signedUrl.startsWith('https://cloud.ru')) {
      signedUrl = signedUrl.replace('https://cloud.ru', 'https://s3.cloud.ru');
    }

    console.log(`[VIDEO_REDIRECT_SUCCESS] Исправленная ссылка успешно создана: ${signedUrl}. Выполняем редирект.`);

    return NextResponse.redirect(signedUrl, { status: 302 });

  } catch (error: any) {
    console.error(`[VIDEO_REDIRECT_CRITICAL] Критическая ошибка роута видео для ${decodedKey}:`, error.message);
    return NextResponse.json({ error: 'Внутренняя ошибка авторизации медиапотока' }, { status: 500 });
  }
}

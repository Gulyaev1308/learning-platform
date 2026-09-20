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
    // === СВЕРХГЛУБОКОЕ ТОЧЕЧНОЕ ЛОГИРОВАНИЕ ДЛЯ ОПРЕДЕЛЕНИЯ КОРНЯ ПРОБЛЕМЫ ===
    console.error(`[VIDEO_PROXY_CRITICAL] Произошел сбой. Имя ошибки: ${error?.name} | Сообщение: ${error?.message}`);
    
    // ИСПРАВЛЕНО ДЛЯ TYPESCRIPT: Обращаемся через строковый ключ, чтобы обойти ошибку компиляции
    const s3Response = error ? error['\$response'] : null;

    if (s3Response) {
      console.error(`[S3_RAW_RESPONSE_STATUS] HTTP Status: ${s3Response.statusCode}`);
      
      if (s3Response.body) {
        try {
          const rawBody = s3Response.body;
          // Переводим тело ответа шлюза Cloud.ru в читаемый текст
          console.error(`[S3_RAW_XML_BODY]:`, rawBody.toString('utf-8'));
        } catch (e: any) {
          console.error(`[S3_RAW_BODY_READ_FAIL] Не удалось прочитать тело ответа: ${e.message}`);
        }
      }
      
      if (s3Response.headers) {
        console.error(`[S3_RAW_HEADERS]:`, JSON.stringify(s3Response.headers));
      }
    } else {
      console.error(`[S3_NO_RESPONSE_OBJECT] Объект скрытого ответа $response отсутствует в ошибке.`);
    }
    // =======================================================================

    return NextResponse.json({ 
      error: 'Ошибка сервера при чтении видеопотока', 
      details: error?.message 
    }, { status: 500 });
  }
}

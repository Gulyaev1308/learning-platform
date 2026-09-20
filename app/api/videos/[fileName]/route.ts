import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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
  // Точечно декодируем имя файла, чтобы исключить баги с %20, %7B и т.д.
  const rawFileName = (await params).fileName;
  const fileName = decodeURIComponent(rawFileName);
  
  try {
    console.log(`[VIDEO_PROXY_START] Студент затребовал поток файла: "${fileName}"`);

    const rangeHeader = request.headers.get('range');

    // 1. Формируем опции для запроса к Cloud.ru. Если есть Range, пробрасываем его прямо в S3!
    const s3Params: any = {
      Bucket: BUCKET_NAME,
      Key: fileName,
    };

    if (rangeHeader) {
      s3Params.Range = rangeHeader;
    }

    const command = new GetObjectCommand(s3Params);
    const s3Response = await s3.send(command);
    
    if (!s3Response.Body) {
      console.error(`[VIDEO_PROXY_ERROR] Тело ответа от Cloud.ru пущено для ключа: ${fileName}`);
      return NextResponse.json({ error: 'Файл пуст' }, { status: 404 });
    }

    // Твой плеер требует правильные заголовки для перемотки
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', s3Response.ContentType || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    if (s3Response.ContentRange) {
      responseHeaders.set('Content-Range', s3Response.ContentRange);
    }
    if (s3Response.ContentLength) {
      responseHeaders.set('Content-Length', s3Response.ContentLength.toString());
    }

    // Переводим веб-стрим в нативный читаемый поток Next.js без забивания RAM буферами
    const stream = s3Response.Body as Readable;

    console.log(`[VIDEO_PROXY_STREAM_OK] Стриминг файла ${fileName} успешно инициирован. Range: ${rangeHeader || 'нет'}`);
    
    return new NextResponse(stream as any, {
      status: rangeHeader ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.code === 'NoSuchKey') {
      console.error(`[VIDEO_PROXY_404] Файл "${fileName}" физически отсутствует в бакете Cloud.ru!`);
      return NextResponse.json({ 
        error: 'Видеофайл не найден в облаке', 
        hint: 'Убедитесь, что имя файла в БД совпадает с именем в Object Storage' 
      }, { status: 404 });
    }

    console.error(`[VIDEO_PROXY_CRITICAL] Критический сбой прокси для файла ${fileName}:`, error.message);
    return NextResponse.json({ error: 'Ошибка сервера при стриминге из S3' }, { status: 500 });
  }
}

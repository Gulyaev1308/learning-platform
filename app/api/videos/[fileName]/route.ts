import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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
    const rangeHeader = request.headers.get('range');
    const s3Params: any = {
      Bucket: BUCKET_NAME,
      Key: decodedKey,
    };

    if (rangeHeader) {
      s3Params.Range = rangeHeader;
    }

    const command = new GetObjectCommand(s3Params);
    const s3Response = await s3.send(command);
    
    if (!s3Response.Body) {
      return NextResponse.json({ error: 'Файл пуст' }, { status: 404 });
    }

    // Конвертируем Node-поток из AWS SDK в Web ReadableStream для NextResponse (Фикс ошибки 500)
    const nodeStream = s3Response.Body as any;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: any) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err: any) => controller.error(err));
      },
      cancel() {
        if (nodeStream.destroy) nodeStream.destroy();
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', s3Response.ContentType || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    
    if (s3Response.ContentRange) responseHeaders.set('Content-Range', s3Response.ContentRange);
    if (s3Response.ContentLength) responseHeaders.set('Content-Length', s3Response.ContentLength.toString());

    return new NextResponse(webStream, {
      status: rangeHeader ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error(`[VIDEO_PROXY_ERROR] Ошибка стриминга ${decodedKey}:`, error.message);
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Файл отсутствует в S3' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ошибка чтения из облака' }, { status: 500 });
  }
}

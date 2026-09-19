import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru',
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

    const { key, totalChunks } = await request.json();
    
    // Последовательно скачиваем чанки из S3 в буфер памяти (по одному!) и склеиваем
    let finalBuffer = Buffer.alloc(0);

    for (let i = 1; i <= totalChunks; i++) {
      const chunkKey = `${key}.part${i}`;
      
      const getCommand = new GetObjectCommand({
        Bucket: 'mesa-edtech-media-bucket',
        Key: chunkKey,
      });

      const s3Response = await s3.send(getCommand);
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };

      const chunkBuffer = await streamToBuffer(s3Response.Body);
      finalBuffer = Buffer.concat([finalBuffer, chunkBuffer]);

      // Удаляем временный чанк, чтобы не занимать место
      await s3.send(new DeleteObjectCommand({ Bucket: 'mesa-edtech-media-bucket', Key: chunkKey }));
    }

    // Загружаем готовый цельный файл обратно в S3
    await s3.send(new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: key,
      Body: finalBuffer,
      ContentType: 'video/mp4',
    }));

    return NextResponse.json({ 
      success: true,
      url: `https://cloud.ru/mesa-edtech-media-bucket/${key}` 
    });
  } catch (error) {
    console.error('Ошибка сборки файла:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

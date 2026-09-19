import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://cloud.ru', // ИСПРАВЛЕНО ТОЧНО: Вернули оригинальный эндпоинт из вашего рабочего конфига
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

// УБРАЛИ МЕТОД GET, чтобы полностью исключить кэширование Next.js и редиректы Nginx

export async function POST(request: NextRequest) {
  // ЛОКАЛЬНЫЙ ЛОГ: Проверяем, что запрос дошел до бэкенда
  console.log(`=== [SERVER BACKEND LOG: Получен POST запрос] ===`);
  
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      console.log(`[SERVER BACKEND] Отказано в доступе: не админ`);
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const key = request.headers.get('x-file-key');
    const partNumber = request.headers.get('x-part-number');

    // ЛОКАЛЬНЫЙ ЛОГ: Проверяем заголовки чанка
    console.log(`[SERVER BACKEND] Ключ файла: ${key}, Номер чанка: ${partNumber}`);

    if (!key || !partNumber) {
      return NextResponse.json({ error: 'Пропущены заголовки x-file-key или x-part-number' }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[SERVER BACKEND] Размер принятого буфера: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    const chunkKey = `${key}.part${partNumber}`;

    const command = new PutObjectCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: chunkKey,
      Body: buffer,
      ContentType: 'application/octet-stream',
    });

    // Шлем в S3 Cloud.ru
    await s3.send(command);
    console.log(`[SERVER BACKEND] Чанк ${partNumber} успешно сохранен в S3`);

    return NextResponse.json({
      success: true,
      partKey: chunkKey,
      partNumber: parseInt(partNumber, 10)
    });
  } catch (error) {
    // ГЛУБОКОЕ ЛОГИРОВАНИЕ: Выводим полную ошибку S3 в консоль докера
    console.error('=== [SERVER CRITICAL ERROR] ===');
    console.error(error);
    
    return NextResponse.json({ 
      error: 'Backend S3 Error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

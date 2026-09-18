import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { getSession } from '@/lib/auth';

// Инициализируем клиент S3 для Cloud.ru Evolution
const s3 = new S3Client({
  region: 'ru-central1', // Стандартный регион для Cloud.ru
  endpoint: 'https://cloud.ru', // Официальный эндпоинт Evolution
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // 1. Проверяем сессию администратора
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // 2. Достаем файл из запроса
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });

    // 3. Формируем уникальное имя файла
    const ext = path.extname(file.name) || '.mp4';
    const fileName = `video_${Date.now()}${ext}`;

    // 4. Переводим файл в буфер для отправки по сети в S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Отправляем тяжелый файл напрямую в бесконечное облако S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'video/mp4',
    });

    await s3.send(uploadCommand);
    console.log('Успешно загружено в Cloud.ru S3:', fileName);

    // Возвращаем ссылку. Next.js роут /api/videos/[name] будет читать из S3, фронтенд не сломается!
    return NextResponse.json({ success: true, url: `/api/videos/${fileName}` });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка S3 хранилища: ' + (error as Error).message }, { status: 500 });
  }
}

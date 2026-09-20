import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1', 
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: true, 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const BUCKET_NAME = 'mesa-edtech-media-bucket';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      console.warn('[AUTH_WARN] [GET /api/admin/upload] Попытка несанкционированного доступа');
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const fileName = request.nextUrl.searchParams.get('fileName');
    if (!fileName) {
      return NextResponse.json({ error: 'Имя файла обязательно' }, { status: 400 });
    }

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;

    console.log(`[S3_UPLOAD_LOG] Генерация ссылки для файла: ${fileName} -> Сгенерированное имя в S3: ${uniqueFileName}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileTypeByExt(ext),
    });

    // Генерация подписанной ссылки для прямой загрузки с фронтенда в Cloud.ru
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // ИСПРАВЛЕНО: Формируем правильный путь для твоего прокси-роута видеоплейера /api/videos/
    const fileViewUrl = `/api/videos/${uniqueFileName}`;

    console.log(`[S3_UPLOAD_SUCCESS] Ссылки успешно созданы. fileUrl для БД: ${fileViewUrl}`);

    return NextResponse.json({ uploadUrl, fileUrl: fileViewUrl });
  } catch (error: any) {
    console.error('[API_ERROR] [GET /api/admin/upload] Ошибка:', error.message, error.stack);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      console.warn('[AUTH_WARN] [DELETE /api/admin/upload] Попытка несанкционированного удаления');
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { fileUrl } = await request.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'Укажите fileUrl' }, { status: 400 });
    }

    console.log(`[S3_CLEANUP_LOG] Запрос на удаление файла. Получен URL: ${fileUrl}`);

    // Извлекаем чистое имя файла из ссылки (поддерживает как полные URL, так и относительные /api/videos/name)
    const key = fileUrl.split('/').pop();

    if (!key || key === 'videos' || key === 'cloud.ru{uniqueFileName}') {
      throw new Error(`Некорректный ключ файла для удаления из S3: ${key}`);
    }

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    console.log(`[S3_CLEANUP_ACTION] Отправка команды удаления в Cloud.ru S3 для Key: ${key}`);
    
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    console.log(`[S3_CLEANUP_SUCCESS] Файл ${key} успешно физически удален из бакета ${BUCKET_NAME}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API_ERROR] [DELETE /api/admin/upload] Ошибка очистки:', error.message, error.stack);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Вспомогательная функция для точного определения Content-Type
function fileTypeByExt(ext: string): string {
  const types: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

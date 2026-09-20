import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru',
  // ИСПРАВЛЕНО ДЛЯ CLOUD.RU EVOLUTION: Отключаем forcePathStyle,
  // чтобы подписанные ссылки генерировались в правильном формате bucket.s3.cloud.ru
  forcePathStyle: false,
  // ИСПРАВЛЕНО ДЛЯ TYPESCRIPT: Отключаем валидацию чек-сумм на уровне клиента,
  // чтобы заголовки CRC32 не ломали preflight-запросы (CORS) в Cloud.ru
  responseChecksumValidation: 'WHEN_REQUIRED',
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

    // ИСПРАВЛЕНО: Убрано свойство из команды во избежание ошибки перегрузки типов.
    // Глобальное управление перенесено в конструктор S3Client выше
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileTypeByExt(ext),
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const fileViewUrl = `/api/videos/${uniqueFileName}`;

    console.log(`[S3_UPLOAD_SUCCESS] Ссылки успешно созданы. fileUrl для БД: ${fileViewUrl}`);

    return NextResponse.json({ uploadUrl, fileUrl: fileViewUrl });
  } catch (error: any) {
    console.error('[API_ERROR] [GET /api/admin/upload] Ошибка:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

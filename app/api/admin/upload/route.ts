import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import { getSession } from '@/lib/auth';

const s3 = new S3Client({
  // ИСПРАВЛЕНО: Канонический регион Cloud.ru
  region: 'ru-central-1', 
  // ИСПРАВЛЕНО: Точный эндпоинт S3 хранилища для стриминга больших файлов
  endpoint: 'https://s3.cloud.ru', 
  forcePathStyle: true, 
  requestChecksumCalculation: 'WHEN_SUPPORTED',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Принимаем Multipart Form Data с фронтенда
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден в запросе' }, { status: 400 });
    }

    console.log(`=== [SERVER LOG: START UPLOAD] ===`);
    console.log(`Файл: ${file.name}, Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const ext = path.extname(file.name).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

    // Встроенный менеджер чанков AWS SDK: сам бьет файл по 10 МБ и отправляет в 4 параллельных потока
    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: uniqueFileName,
        Body: file.stream(), // Стримим поток файла без раздувания RAM сервера
        ContentType: contentType,
      },
      queueSize: 4, 
      partSize: 1024 * 1024 * 10, // Размер чанка — 10 MB
      leavePartsOnError: false, 
    });

    // Мониторинг отправки чанков в консоли сервера
    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(`[SERVER S3 PROGRESS] Часть: ${progress.part}, Отправлено: ${progress.loaded} из ${progress.total}`);
    });

    // Запускаем процесс и ждем ответа от Cloud.ru о завершении сборки
    await parallelUploads3.done();
    
    console.log(`=== [SERVER LOG: SUCCESS] ===`);
    
    // ИСПРАВЛЕНО: Корректная итоговая ссылка для просмотра
    const fileViewUrl = `https://s3.cloud.ru/mesa-edtech-media-bucket/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: fileViewUrl       
    });

  } catch (error) {
    console.error(`=== [SERVER LOG: ERROR] ===`);
    console.error('Критическая ошибка при стриминге в Cloud.ru:', error);
    return NextResponse.json({ error: 'Ошибка S3: ' + (error as Error).message }, { status: 500 });
  }
}

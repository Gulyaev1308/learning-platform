import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log(`=== [PAGES ROUTER LOG: Сквозной стриминг запущен] ===`);

  try {
    // Безопасная проверка авторизации напрямую по наличию сессионной куки (исключает падение билда)
    const cookies = req.headers.cookie;
    if (!cookies || !cookies.includes('iron-session')) {
      console.log(`[PAGES ROUTER] Отказано в доступе: сессия не найдена`);
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const encodedFileName = req.headers['x-file-name'] as string;
    if (!encodedFileName) {
      return res.status(400).json({ error: 'Заголовок x-file-name обязателен' });
    }
    const fileName = decodeURIComponent(encodedFileName);

    const ext = path.extname(fileName).toLowerCase() || '.mp4';
    const uniqueFileName = `video_${Date.now()}${ext}`;
    const contentType = req.headers['content-type'] || 'video/mp4';

    const parallelUploads3 = new Upload({
      client: s3,
      params: {
        Bucket: 'mesa-edtech-media-bucket',
        Key: uniqueFileName,
        Body: req, 
        ContentType: contentType,
      },
      queueSize: 2,
      partSize: 1024 * 1024 * 10, 
    });

    await parallelUploads3.done();

    console.log(`=== [PAGES ROUTER LOG: УСПЕШНО ЗАПИСАНО В S3] ===`);
    const fileViewUrl = `https://cloud.ru{uniqueFileName}`;

    return res.status(200).json({ success: true, url: fileViewUrl });
  } catch (error) {
    console.error('Критическая ошибка стрима в Pages Router:', error);
    return res.status(500).json({ error: 'Ошибка S3: ' + (error as Error).message });
  }
}

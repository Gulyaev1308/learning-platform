import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем сырой запрос
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const fileObj = file as File;
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    
    if (!fs.existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeName = fileObj.name.replace(/[^\w\-.]/g, '_');
    const finalName = `${timestamp}_${safeName}`;
    const filePath = path.join(videosDir, finalName);

    const buffer = Buffer.from(await fileObj.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log('Video saved:', filePath, buffer.length);

    return NextResponse.json({ success: true, url: `/videos/${finalName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

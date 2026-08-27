import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { getSession } from '@/lib/auth';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.mp4';
    const fileName = `video_${Date.now()}${ext}`;
    
    // Сохраняем в /tmp (Render позволяет писать в /tmp)
    const tmpDir = '/tmp/videos';
    if (!fs.existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log('✅ Saved:', filePath, buffer.length);

    return NextResponse.json({ 
      success: true, 
      url: `/api/videos/${fileName}`,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

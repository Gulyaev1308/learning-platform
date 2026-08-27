import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    const filePath = path.join('/tmp/videos', fileName);

    console.log('Looking for video:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('❌ Video not found:', filePath);
      return NextResponse.json({ error: 'Видео не найдено' }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const buffer = await readFile(filePath);
    
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'application/octet-stream';

    console.log('✅ Serving video:', filePath, buffer.length);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Video serve error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

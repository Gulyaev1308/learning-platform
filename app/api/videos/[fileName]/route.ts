import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    const filePath = path.join('/tmp/videos', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Видео не найдено' }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'video/mp4';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}

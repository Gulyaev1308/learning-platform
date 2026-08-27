import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  try {
    const { fileName } = await params;
    const filePath = path.join('/tmp/videos', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Видео не найдено', path: filePath }, { status: 404 });
    }

    const fileStat = await stat(filePath);
    const buffer = await readFile(filePath);
    const uint8Array = new Uint8Array(buffer);

    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0]);
      const end = parts[1] ? parseInt(parts[1]) : buffer.length - 1;
      const chunk = uint8Array.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': (end - start + 1).toString(),
        },
      });
    }

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Video serve error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  try {
    const { fileName } = await params;
    
    console.log('Requested video:', fileName);

    // Проверяем, число ли это (ID) или строка (filename)
    let result;
    if (/^\d+$/.test(fileName)) {
      result = await db.query('SELECT * FROM videos WHERE id = $1', [parseInt(fileName)]);
    } else {
      result = await db.query('SELECT * FROM videos WHERE filename = $1 OR id::text = $1', [fileName]);
    }

    const video = result.rows[0];

    if (!video) {
      console.log('Video not found:', fileName);
      return NextResponse.json({ error: 'Видео не найдено' }, { status: 404 });
    }

    const buffer = video.data as Buffer;
    const totalLength = buffer.length;
    const uint8Array = new Uint8Array(buffer);

    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0]);
      const end = parts[1] ? parseInt(parts[1]) : totalLength - 1;
      const chunkSize = end - start + 1;
      const chunk = uint8Array.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': video.content_type || 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
        },
      });
    }

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': video.content_type || 'video/mp4',
        'Content-Length': totalLength.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Video serve error:', error);
    return NextResponse.json({ error: 'Ошибка: ' + (error as Error).message }, { status: 500 });
  }
}

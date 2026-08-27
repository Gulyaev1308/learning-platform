import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  const videoId = parseInt(fileName);

  const result = await db.query('SELECT * FROM videos WHERE id = $1', [videoId]);
  const video = result.rows[0];

  if (!video) {
    return NextResponse.json({ error: 'Видео не найдено' }, { status: 404 });
  }

  const buffer = video.data as Buffer;
  const totalLength = buffer.length;

  // Поддержка Range requests для перемотки
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0]);
    const end = parts[1] ? parseInt(parts[1]) : totalLength - 1;
    const chunkSize = end - start + 1;
    const chunk = buffer.subarray(start, end + 1);

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        'Content-Type': video.content_type || 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  }

  // Полный ответ
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': video.content_type || 'video/mp4',
      'Content-Length': totalLength.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    },
  });
}

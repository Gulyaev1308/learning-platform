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

  return new NextResponse(video.data, {
    headers: {
      'Content-Type': video.content_type || 'video/mp4',
      'Content-Length': video.data.length.toString(),
      'Accept-Ranges': 'bytes',
    },
  });
}

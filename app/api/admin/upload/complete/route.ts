import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'ru-central-1',
  endpoint: 'https://cloud.ru',
  forcePathStyle: true,
  credentials: { 
    accessKeyId: process.env.S3_ACCESS_KEY || '', 
    secretAccessKey: process.env.S3_SECRET_KEY || '' 
  },
});

export async function POST(request: NextRequest) {
  try {
    const { uploadId, key, parts } = await request.json();
    const command = new CompleteMultipartUploadCommand({
      Bucket: 'mesa-edtech-media-bucket',
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await s3.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

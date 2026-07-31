import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const CACHE_DIR = path.join(process.cwd(), 'public', 'images', 'source-cache');

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Prevent path traversal.
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = path.join(CACHE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = EXT_TO_MIME[ext] || 'image/jpeg';

  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      'content-length': String(buffer.length),
    },
  });
}

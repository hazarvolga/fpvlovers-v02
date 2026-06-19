import fs from 'node:fs';
import {
  buildPrivateYouTubeUploadPayload,
  type VideoManifest,
} from '@/lib/video/video-manifest';

type UploadCopy = {
  title: string;
  description: string;
  tags: string[];
};

export type YouTubeUploadResult = {
  status: 'dry-run' | 'uploaded';
  videoId?: string;
  payload: ReturnType<typeof buildPrivateYouTubeUploadPayload>;
};

async function getYouTubeAccessToken(): Promise<string> {
  if (process.env.YOUTUBE_ACCESS_TOKEN?.trim()) return process.env.YOUTUBE_ACCESS_TOKEN.trim();
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube OAuth credentials are incomplete.');
  }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const data: unknown = await response.json();
  const record = data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
  if (!response.ok || typeof record.access_token !== 'string') {
    throw new Error(`YouTube OAuth token request failed (${response.status}).`);
  }
  return record.access_token;
}

export async function uploadPrivateYouTubeVideo(
  manifest: VideoManifest,
  videoPath: string,
  copy: UploadCopy,
): Promise<YouTubeUploadResult> {
  const payload = buildPrivateYouTubeUploadPayload(manifest, copy);
  if (process.env.ENABLE_YOUTUBE_UPLOAD !== 'true') {
    return { status: 'dry-run', payload };
  }
  if (manifest.uploadVisibility !== 'private') throw new Error('Only private YouTube uploads are allowed.');
  if (!fs.existsSync(videoPath)) throw new Error(`Rendered video not found: ${videoPath}`);

  const accessToken = await getYouTubeAccessToken();
  const start = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,paidProductPlacementDetails',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const uploadUrl = start.headers.get('location');
  if (!start.ok || !uploadUrl) throw new Error(`YouTube resumable upload initialization failed (${start.status}).`);

  const bytes = fs.readFileSync(videoPath);
  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(bytes.byteLength) },
    body: bytes,
    signal: AbortSignal.timeout(10 * 60_000),
  });
  const data: unknown = await upload.json();
  const record = data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
  if (!upload.ok || typeof record.id !== 'string') {
    throw new Error(`YouTube video upload failed (${upload.status}).`);
  }
  return { status: 'uploaded', videoId: record.id, payload };
}

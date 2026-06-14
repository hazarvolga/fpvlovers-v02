import { YoutubeTranscript } from 'youtube-transcript';

export interface YoutubeTranscriptResult {
  videoId: string;
  transcript: string;
  durationMs: number;
}

export function extractYoutubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

async function tryFetchTranscript(videoId: string): Promise<Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>> {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId);
  } catch {
    const autoGenLangs = ['en', 'en-US', 'en-GB', 'tr', 'de', 'fr', 'es'];
    for (const lang of autoGenLangs) {
      try {
        return await YoutubeTranscript.fetchTranscript(videoId, { lang });
      } catch {
        continue;
      }
    }
    throw new Error(`No transcript available for ${videoId} in any language`);
  }
}

export async function fetchYoutubeTranscript(url: string): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    const transcriptList = await tryFetchTranscript(videoId);

    const transcript = transcriptList.map(item => item.text).join(' ');

    const lastSegment = transcriptList[transcriptList.length - 1];
    const durationMs = lastSegment ? lastSegment.offset + lastSegment.duration : 0;

    return {
      videoId,
      transcript,
      durationMs
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch transcript: ${msg}`);
  }
}

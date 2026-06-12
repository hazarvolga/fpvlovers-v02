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

export async function fetchYoutubeTranscript(url: string): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Concatenate all text segments
    const transcript = transcriptList.map(item => item.text).join(' ');
    
    // Calculate approximate duration from the last segment
    const lastSegment = transcriptList[transcriptList.length - 1];
    const durationMs = lastSegment ? lastSegment.offset + lastSegment.duration : 0;

    return {
      videoId,
      transcript,
      durationMs
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}

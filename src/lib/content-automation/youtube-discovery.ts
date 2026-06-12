import fs from 'fs';
import path from 'path';
import { getOptionalEnv } from '@/lib/env';
import { safeReadJson } from '@/lib/utils/json';

const JOBS_FILE = path.join(process.cwd(), 'data', 'youtube-jobs.json');

export type YoutubeJobStatus = 'completed' | 'failed' | 'skipped';

export interface YoutubeJob {
  videoId: string;
  url: string;
  status: YoutubeJobStatus;
  dateAdded: string;
  error?: string;
}

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  url: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
}

export function getYoutubeJobs(): YoutubeJob[] {
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const data = safeReadJson<any>(JOBS_FILE, null);
    return data.jobs || [];
  } catch (err) {
    console.error('[YouTube Discovery] Error reading jobs file', err);
    return [];
  }
}

export function saveYoutubeJob(job: YoutubeJob) {
  const jobs = getYoutubeJobs();
  const existingIndex = jobs.findIndex(j => j.videoId === job.videoId);
  
  if (existingIndex >= 0) {
    jobs[existingIndex] = job;
  } else {
    jobs.push(job);
  }

  fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs }, null, 2));
}

export function isVideoProcessed(videoId: string): boolean {
  const jobs = getYoutubeJobs();
  // If it's completed or explicitly skipped, don't re-process
  return jobs.some(j => j.videoId === videoId && (j.status === 'completed' || j.status === 'skipped'));
}

export async function discoverTopVideos(query: string, daysAgo: number = 7, maxResults: number = 5): Promise<YoutubeSearchResult[]> {
  const apiKey = getOptionalEnv('YOUTUBE_API_KEY', '');
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not defined in environment variables');
  }

  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysAgo);
  const rfc3339Date = publishedAfter.toISOString();

  // 1. Search for top videos matching query
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.append('part', 'snippet');
  searchUrl.searchParams.append('q', query);
  searchUrl.searchParams.append('type', 'video');
  searchUrl.searchParams.append('order', 'viewCount');
  searchUrl.searchParams.append('publishedAfter', rfc3339Date);
  searchUrl.searchParams.append('maxResults', maxResults.toString());
  searchUrl.searchParams.append('videoCaption', 'any'); // Can also use 'closedCaption' to be strict, but 'any' gets auto-subs
  searchUrl.searchParams.append('key', apiKey);

  const res = await fetch(searchUrl.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 3600 } // Cache briefly
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown Error');
    throw new Error(`YouTube API Error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const results: YoutubeSearchResult[] = [];

  for (const item of (data.items || [])) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;

    results.push({
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: item.snippet?.title || '',
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || '',
      publishedAt: item.snippet?.publishedAt || ''
    });
  }

  return results;
}

export async function findUnprocessedTrendVideos(queries: string[], daysAgo: number = 7): Promise<YoutubeSearchResult[]> {
  const allCandidates: YoutubeSearchResult[] = [];

  for (const query of queries) {
    try {
      const videos = await discoverTopVideos(query, daysAgo, 3); // top 3 per query
      allCandidates.push(...videos);
    } catch (err) {
      console.error(`[YouTube Discovery] Failed to fetch query: ${query}`, err);
    }
  }

  // Deduplicate by videoId
  const uniqueVideos = Array.from(new Map(allCandidates.map(v => [v.videoId, v])).values());

  // Filter out already processed
  const unprocessed = uniqueVideos.filter(v => !isVideoProcessed(v.videoId));

  return unprocessed;
}

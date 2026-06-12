import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv } from '@/lib/env';
import { findUnprocessedTrendVideos, saveYoutubeJob } from '@/lib/content-automation/youtube-discovery';
import { generateJournalistArticle } from '@/lib/content-automation/youtube-generator';

const YOUTUBE_QUERIES = [
  "FPV drone review",
  "Cinewhoop build",
  "Joshua Bardwell",
  "Oscar Liang FPV"
];

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize CRON request
    const authHeader = req.headers.get('authorization');
    const secret = getOptionalEnv('CRON_SECRET', '');
    if (secret && authHeader !== `Bearer ${secret}`) {
      // In development we might allow it without token, but in prod we block
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const isDryRun = req.nextUrl.searchParams.get('dryRun') === 'true';

    // 2. Discover unprocessed top videos
    const unprocessed = await findUnprocessedTrendVideos(YOUTUBE_QUERIES, 7);

    if (unprocessed.length === 0) {
      console.log('[CRON YouTube] No new trend videos found in the last 7 days.');
      return NextResponse.json({ message: 'No new trend videos found', processedCount: 0 });
    }

    // Sort by view count logic is handled implicitly by YouTube API returning by viewCount
    // We just take the first one (most popular across all queries) to process one per run.
    const candidate = unprocessed[0];

    if (isDryRun) {
      return NextResponse.json({
        message: 'Dry run successful',
        candidate: candidate,
        totalUnprocessedFound: unprocessed.length
      });
    }

    // 3. Process the video
    try {
      const generated = await generateJournalistArticle(candidate.url);

      // Save job status
      saveYoutubeJob({
        videoId: candidate.videoId,
        url: candidate.url,
        status: 'completed',
        dateAdded: new Date().toISOString()
      });

      console.log(`[CRON YouTube] Processed video ${candidate.videoId}: successfully generated`);

      return NextResponse.json({
        message: 'Processed top trend video',
        video: candidate,
        result: generated
      });

    } catch (err: any) {
      // Mark as failed so we can retry or ignore later
      saveYoutubeJob({
        videoId: candidate.videoId,
        url: candidate.url,
        status: 'failed',
        dateAdded: new Date().toISOString(),
        error: err.message || 'Unknown error'
      });

      console.error(`[CRON YouTube] Failed processing ${candidate.videoId}: ${err.message}`);
      return NextResponse.json({ error: 'Failed to process video', details: err.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`[CRON YouTube] Cron execution error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

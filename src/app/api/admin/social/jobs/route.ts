import { NextResponse } from 'next/server';
import { getPublishedContentBySlugAsync } from '@/lib/content-automation/content-reader';
import { createSocialJob } from '@/lib/social/social-orchestrator';
import { readSocialJobs, upsertSocialJob } from '@/lib/social/social-job-store';
import type { SocialPlatform } from '@/lib/social/types';
import { generateVideoManifest } from '@/lib/video/video-director';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

const PLATFORMS = new Set<SocialPlatform>([
  'facebook',
  'instagram',
  'youtube-shorts',
  'tiktok',
  'x',
  'reddit',
  'linkedin',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ success: true, jobs: readSocialJobs() });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = asRecord(await request.json());
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const platforms = Array.isArray(body?.platforms)
      ? body.platforms.filter((value): value is SocialPlatform => typeof value === 'string' && PLATFORMS.has(value as SocialPlatform))
      : [];
    if (!slug || platforms.length === 0) {
      return NextResponse.json({ success: false, error: 'slug and at least one valid platform are required' }, { status: 400 });
    }
    const article = await getPublishedContentBySlugAsync(slug);
    if (!article) return NextResponse.json({ success: false, error: 'Published article not found' }, { status: 404 });

    const job = createSocialJob(article, platforms);
    upsertSocialJob(job);
    const video = platforms.includes('youtube-shorts') || platforms.includes('tiktok') || platforms.includes('instagram')
      ? await generateVideoManifest(job.factPack, job.requiresHumanApproval)
      : undefined;

    return NextResponse.json({
      success: true,
      dryRun: true,
      job,
      video,
      message: 'Social job prepared. No platform post or video upload was performed.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown social job error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

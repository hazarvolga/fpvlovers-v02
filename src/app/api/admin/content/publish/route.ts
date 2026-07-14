import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { loadContentJobsNew, saveContentJobsNew } from '@/lib/content-automation/queue';
import type { ContentJob, ContentJobStatus } from '@/lib/content-automation/types';
import type { GeneratedContent } from '@/lib/content-automation/parse-generated-content';
import { buildContentMedia } from '@/lib/content-automation/content-media';
import { publishGeneratedContentArtifact } from '@/lib/content-automation/publish-artifact';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { jobId, content, dryRun } = body as {
      jobId: string;
      content?: GeneratedContent;
      dryRun?: boolean;
    };

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 },
      );
    }

    const jobs = await loadContentJobsNew();
    const index = jobs.findIndex((j) => j.id === jobId);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[index];
    const alreadyPublished = job.status === 'published';

    if (job.status !== 'approved' && !alreadyPublished) {
      return NextResponse.json(
        { success: false, error: `Job status is "${job.status}" — must be "approved" to publish` },
        { status: 409 },
      );
    }

    const publishContent: GeneratedContent = content || {
      title: job.title,
      seo: {
        slug: job.seo.slug,
        metaDescription: job.seo.metaDescription,
        keywords: job.seo.keywords,
      },
      excerpt: job.topic,
      bodySections: [{ id: 'main', title: job.title, content: '' }],
      internalLinks: [],
      publishNotes: [],
      media: buildContentMedia({
        slug: job.seo.slug || job.briefSlug,
        title: job.title,
        category: job.category,
        excerpt: job.topic,
      }),
    };

    const slug = publishContent.seo?.slug || job.seo.slug || job.briefSlug;

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        job,
        targetDir: 'content/published',
        targetSlug: slug,
        targetFiles: [`${slug}.json`, `${slug}.md`],
        contentPreview: publishContent.title,
        alreadyPublished: alreadyPublished,
      });
    }

    if (alreadyPublished) {
      const publishedFile = await publishGeneratedContentArtifact(slug, job, publishContent);
      revalidatePath('/');
      revalidatePath('/sitemap.xml');
      return NextResponse.json({
        success: true,
        idempotent: true,
        job,
        publishedFile,
      });
    }

    const publishedFile = await publishGeneratedContentArtifact(slug, job, publishContent);

    const now = new Date().toISOString();
    job.status = 'published' as ContentJobStatus;
    job.updatedAt = now;
    job.publishedPath = publishedFile;
    jobs[index] = job;
    await saveContentJobsNew(jobs);
    revalidatePath('/');
    revalidatePath('/sitemap.xml');

    // Log to database in background
    Promise.resolve().then(async () => {
      try {
        const { logAnalyticsEvent } = await import('@/lib/server/analytics-store');
        await logAnalyticsEvent({
          eventType: 'content_publish',
          contentSlug: slug,
          source: 'admin',
          metadata: {
            jobId: job.id,
            title: job.title,
            category: job.category
          }
        });
      } catch (dbErr) {
        console.warn('[DB Analytics] Failed to log content publish event:', dbErr);
      }
    });

    return NextResponse.json({
      success: true,
      idempotent: false,
      job,
      publishedFile: job.publishedPath,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown publish error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

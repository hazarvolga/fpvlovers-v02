import { NextRequest, NextResponse } from 'next/server';
import { loadContentJobs, saveContentJobs } from '@/lib/content-automation/queue';
import type { ContentJob, ContentJobStatus } from '@/lib/content-automation/types';
import type { GeneratedContent } from '@/lib/content-automation/parse-generated-content';
import { buildContentMedia } from '@/lib/content-automation/content-media';
import { publishGeneratedContentArtifact } from '@/lib/content-automation/publish-artifact';

export async function POST(req: NextRequest) {
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

    const jobs = loadContentJobs();
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
    saveContentJobs(jobs);

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

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadContentJobs, saveContentJobs } from '@/lib/content-automation/queue';
import type { ContentJob, ContentJobStatus } from '@/lib/content-automation/types';
import type { GeneratedContent } from '@/lib/content-automation/parse-generated-content';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function publishArtifact(slug: string, job: ContentJob, content: GeneratedContent): boolean {
  ensureDir(PUBLISHED_DIR);
  const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
  const mdPath = path.join(PUBLISHED_DIR, `${slug}.md`);

  const artifact = {
    slug,
    title: content.title,
    jobId: job.id,
    category: job.category,
    template: job.template,
    seo: content.seo,
    excerpt: content.excerpt,
    bodySections: content.bodySections,
    internalLinks: content.internalLinks,
    publishNotes: content.publishNotes,
    jobStatus: job.status,
    publishedAt: new Date().toISOString(),
    promptVersion: job.promptVersion,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');

  const markdown = [
    `# ${content.title}`,
    '',
    `> ${content.excerpt}`,
    '',
    ...content.bodySections.map(
      (section) => `## ${section.title}\n\n${section.content}\n`,
    ),
    ...(content.publishNotes.length > 0
      ? ['', '---', '', ...content.publishNotes.map((n) => `_${n}_`)]
      : []),
  ].join('\n');

  fs.writeFileSync(mdPath, markdown + '\n', 'utf-8');

  return true;
}

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
    };

    const slug = publishContent.seo?.slug || job.seo.slug || job.briefSlug;

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        job,
        targetDir: PUBLISHED_DIR,
        targetSlug: slug,
        targetFiles: [`${slug}.json`, `${slug}.md`],
        contentPreview: publishContent.title,
        alreadyPublished: alreadyPublished,
      });
    }

    if (alreadyPublished) {
      publishArtifact(slug, job, publishContent);
      return NextResponse.json({
        success: true,
        idempotent: true,
        job,
        publishedFile: `content/published/${slug}.json`,
      });
    }

    publishArtifact(slug, job, publishContent);

    const now = new Date().toISOString();
    job.status = 'published' as ContentJobStatus;
    job.updatedAt = now;
    job.publishedPath = `content/published/${slug}.json`;
    jobs[index] = job;
    saveContentJobs(jobs);

    return NextResponse.json({
      success: true,
      idempotent: false,
      job,
      publishedFile: job.publishedPath,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

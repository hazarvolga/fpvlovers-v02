import { NextRequest, NextResponse } from 'next/server';
import { loadContentJobsNew, enqueueContentJobNew } from '@/lib/content-automation/queue';
import type { ContentJobStatus } from '@/lib/content-automation/types';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as ContentJobStatus | null;
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);

    let jobs = await loadContentJobsNew();
    if (status) {
      jobs = jobs.filter((j) => j.status === status);
    }
    jobs = jobs.slice(0, limit);

    return NextResponse.json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, topic, template } = body;

    if (!id || !title || !topic) {
      return NextResponse.json(
        { success: false, error: 'id, title, and topic are required' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const slug = (body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const job = {
      id,
      briefSlug: slug,
      title,
      category: category || 'general',
      status: 'brief' as const,
      topic,
      language: 'en' as const,
      template: template || 'tech-article',
      promptVersion: 'v2',
      sourceHints: body.sourceHints || [],
      seo: {
        slug,
        metaDescription: body.metaDescription || topic,
        keywords: body.keywords || [],
      },
      createdAt: now,
      updatedAt: now,
    };

    const existing = await loadContentJobsNew();
    if (existing.some((j) => j.id === id)) {
      return NextResponse.json(
        { success: false, error: `Job with id "${id}" already exists` },
        { status: 409 },
      );
    }

    await enqueueContentJobNew(job);

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

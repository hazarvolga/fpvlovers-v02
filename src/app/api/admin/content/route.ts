import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateContentViaDify, normalizeContentGenerationTemplate } from '@/lib/content-automation/dify-generation';
import { buildContentMedia } from '@/lib/content-automation/content-media';

const PAGES: Record<string, { name: string; fields: string[]; prompt: string; template?: string }> = {
  roadmap: {
    name: 'Pilot Roadmap',
    fields: ['summary', 'steps'],
    prompt: 'Generate a 3-phase FPV pilot training roadmap.',
    template: 'community-roundup',
  },
  glossary: {
    name: 'FPV Glossary',
    fields: ['summary', 'terms'],
    prompt: 'Generate an FPV glossary for beginners with at least 8 common terms.',
    template: 'community-roundup',
  },
  workshop: {
    name: 'Workshop Masterclass',
    fields: ['summary', 'sections'],
    prompt: 'Generate content for a soldering and repair workshop page.',
    template: 'troubleshooting',
  },
  'tech-article': {
    name: 'Technical Article',
    fields: ['sections'],
    prompt: 'Generate a technical FPV article from raw content.',
    template: 'tech-article',
  },
  'product-review': {
    name: 'Product Review',
    fields: ['sections'],
    prompt: 'Generate a product review from component specs.',
    template: 'product-review',
  },
  'build-guide': {
    name: 'Build Guide',
    fields: ['sections'],
    prompt: 'Generate a build guide from the knowledge base.',
    template: 'build-guide',
  },
  comparison: {
    name: 'Comparison Page',
    fields: ['sections'],
    prompt: 'Generate a product comparison page.',
    template: 'comparison',
  },
  troubleshooting: {
    name: 'Troubleshooting Guide',
    fields: ['sections'],
    prompt: 'Generate a troubleshooting guide for an FPV issue.',
    template: 'troubleshooting',
  },
  'regulation-guide': {
    name: 'Regulation Guide',
    fields: ['sections'],
    prompt: 'Generate a regulatory guide from fpv-regulations dataset.',
    template: 'regulation-guide',
  },
  'community-roundup': {
    name: 'Community Roundup',
    fields: ['sections'],
    prompt: 'Generate a community roundup from forums and discussions.',
    template: 'community-roundup',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { page, customPrompt } = await req.json();
    const config = PAGES[page];
    if (!config) {
      return NextResponse.json({ error: `Unknown page: ${page}. Options: ${Object.keys(PAGES).join(', ')}` }, { status: 400 });
    }

    const result = await generateContentViaDify({
      topic: customPrompt || config.prompt,
      template: normalizeContentGenerationTemplate(config.template || 'tech-article'),
      language: 'en',
      tone: 'professional',
      title: config.name,
      category: page,
      customPrompt: customPrompt ? customPrompt : undefined,
      brief: {
        primaryKeyword: page,
        secondaryKeywords: [],
        summary: config.prompt,
        outline: config.fields,
      },
    });

    if (result.content) {
      const dir = path.join(process.cwd(), 'content');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const withMedia = {
        ...result.content,
        media: result.content.media || buildContentMedia({
          slug: result.content.seo.slug || page,
          title: result.content.title,
          category: config.name,
          excerpt: result.content.excerpt,
        }),
      };
      fs.writeFileSync(path.join(dir, `${page}.json`), JSON.stringify(withMedia, null, 2));
    }

    return NextResponse.json({
      page: config.name,
      success: result.success,
      template: result.template,
      content: result.content,
      rawAnswer: result.rawAnswer.slice(0, 500),
      sources: result.sources,
      workflowRunId: result.workflowRunId,
      totalTokens: result.totalTokens,
      elapsedTime: result.elapsedTime,
      outputs: result.outputs,
      saved: result.content ? `content/${page}.json` : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

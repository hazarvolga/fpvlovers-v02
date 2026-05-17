import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

const BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

const PAGES: Record<string, { name: string; fields: string[]; prompt: string; template?: string }> = {
  'roadmap': {
    name: 'Pilot Roadmap',
    fields: ['summary', 'steps'],
    prompt: 'Generate a 3-phase FPV pilot training roadmap.',
    template: 'community-roundup',
  },
  'glossary': {
    name: 'FPV Glossary',
    fields: ['summary', 'terms'],
    prompt: 'Generate an FPV glossary for beginners with at least 8 common terms.',
    template: 'community-roundup',
  },
  'workshop': {
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
  'comparison': {
    name: 'Comparison Page',
    fields: ['sections'],
    prompt: 'Generate a product comparison page.',
    template: 'comparison',
  },
  'troubleshooting': {
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

    const prompt = customPrompt || config.prompt;
    const appKey = getRequiredEnv('DIFY_APP_KEY');

    const resp = await fetch(`${BASE}/chat-messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${appKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: prompt,
        response_mode: 'blocking',
        user: 'admin-content-gen',
        inputs: {},
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => 'Unknown');
      return NextResponse.json({ error: `FPV Expert API ${resp.status}`, detail: err.slice(0, 300) }, { status: 502 });
    }

    const data = await resp.json();
    const answer = data.answer || '';
    const resources = (data.metadata?.retriever_resources || []).slice(0, 3).map((r: any) => ({
      dataset: r.dataset_name, source: (r.content || '').slice(0, 100), score: r.score,
    }));

    // Extract JSON from answer
    let content = null;
    const jsonMatch = answer.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { content = JSON.parse(jsonMatch[0]); } catch {}
    }

    // Save to file
    if (content) {
      const dir = path.join(process.cwd(), 'content');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${page}.json`), JSON.stringify(content, null, 2));
    }

    return NextResponse.json({
      page: config.name,
      content,
      rawAnswer: answer.slice(0, 500),
      sources: resources,
      saved: content ? `content/${page}.json` : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

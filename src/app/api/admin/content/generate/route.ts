import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';

const BASE = getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1');

const TEMPLATES: Record<string, any> = {
  'tech-article': { sections: ['overview','explanation','step_by_step','safety_warning','conclusion'], affiliate: 'low', safety: true },
  'product-review': { sections: ['overview','specs','pros_cons','comparison','verdict'], affiliate: 'high', safety: false },
  'build-guide': { sections: ['parts_list','assembly','wiring','first_flight','safety'], affiliate: 'low', safety: true },
  'comparison': { sections: ['intro','spec_table','feature_compare','recommendation','buy_links'], affiliate: 'very_high', safety: false },
  'troubleshooting': { sections: ['symptom','causes','diagnosis','solutions','prevention'], affiliate: 'minimal', safety: true },
  'regulation-guide': { sections: ['summary','requirements','process','resources','disclaimer'], affiliate: 'zero', safety: false },
  'community-roundup': { sections: ['trends','opinions','expert_takes','recommendations'], affiliate: 'low', safety: false },
};

export async function POST(req: NextRequest) {
  try {
    const { topic, template, language = 'tr', tone = 'professional' } = await req.json();
    const config = TEMPLATES[template] || TEMPLATES['tech-article'];

    const query = `You are an FPV content engine. Generate a ${template} article about: ${topic}

Use this exact JSON structure:
{ "title": "Article title in ${language === 'tr' ? 'Turkish' : 'English'}", "seo": { "meta_description": "150 char SEO description", "keywords": ["keyword1","keyword2","keyword3"], "slug": "url-friendly-slug" }, "sections": ${JSON.stringify(config.sections.map((s: string) => ({ id: s, title: s.replace(/_/g, ' '), content: 'section text' })))} }

Rules:
- Technical terms stay in English
- ${config.safety ? 'MANDATORY: Include relevant safety warnings' : ''}
- ${config.affiliate !== 'zero' ? `Affiliate density: ${config.affiliate}. Include product CTAs naturally.` : 'NO affiliate links in this content type.'}
- Tone: ${tone}
- Output ONLY valid JSON, no markdown wrappers.`;

    const appKey = getRequiredEnv('DIFY_APP_KEY');
    const resp = await fetch(`${BASE}/chat-messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${appKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, response_mode: 'blocking', user: 'content-orchestrator', inputs: {} }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => 'Unknown');
      return NextResponse.json({ error: `API ${resp.status}`, detail: err.slice(0, 300) }, { status: 502 });
    }

    const data = await resp.json();
    let content = null;
    const jsonMatch = (data.answer || '').match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { content = JSON.parse(jsonMatch[0]); } catch {}
    }

    return NextResponse.json({
      success: !!content,
      content,
      template,
      sources: (data.metadata?.retriever_resources || []).slice(0, 3).map((r: any) => ({
        dataset: r.dataset_name, source: (r.content || '').slice(0, 80), score: r.score,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

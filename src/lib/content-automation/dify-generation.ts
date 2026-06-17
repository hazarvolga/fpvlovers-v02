import { getOptionalEnv, getRequiredEnv } from '@/lib/env';
import { parseGeneratedContent, type GeneratedContent } from './parse-generated-content';

const BASE = getOptionalEnv(
  'DIFY_INTERNAL_BASE_URL',
  getOptionalEnv('APP_API_URL', getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1')),
);

export type ContentGenerationTemplate =
  | 'tech-article'
  | 'product-review'
  | 'build-guide'
  | 'comparison'
  | 'troubleshooting'
  | 'regulation-guide'
  | 'community-roundup';

export type ContentGenerationRequest = {
  topic: string;
  template: ContentGenerationTemplate;
  language?: 'en' | 'tr';
  tone?: string;
  title?: string;
  category?: string;
  wordCount?: number;
  customPrompt?: string;
  brief?: {
    primaryKeyword: string;
    secondaryKeywords: readonly string[];
    summary: string;
    outline: readonly string[];
  };
};

export type ContentGenerationResult = {
  success: boolean;
  template: ContentGenerationTemplate;
  content: GeneratedContent | null;
  rawAnswer: string;
  sources: Array<{ dataset: string; source: string; score: number }>;
  saved?: string | null;
  workflowRunId?: string | null;
  totalTokens?: number | null;
  elapsedTime?: number | null;
  outputs?: Record<string, unknown> | null;
};

type TemplateConfig = {
  sections: string[];
  affiliate: 'zero' | 'minimal' | 'low' | 'high' | 'very_high';
  safety: boolean;
};

const TEMPLATES: Record<ContentGenerationTemplate, TemplateConfig> = {
  'tech-article': {
    sections: ['overview', 'explanation', 'step_by_step', 'safety_warning', 'conclusion'],
    affiliate: 'low',
    safety: true,
  },
  'product-review': {
    sections: ['overview', 'specs', 'pros_cons', 'comparison', 'verdict'],
    affiliate: 'high',
    safety: false,
  },
  'build-guide': {
    sections: ['parts_list', 'assembly', 'wiring', 'first_flight', 'safety'],
    affiliate: 'low',
    safety: true,
  },
  'comparison': {
    sections: ['intro', 'spec_table', 'feature_compare', 'recommendation', 'buy_links'],
    affiliate: 'very_high',
    safety: false,
  },
  'troubleshooting': {
    sections: ['symptom', 'causes', 'diagnosis', 'solutions', 'prevention'],
    affiliate: 'minimal',
    safety: true,
  },
  'regulation-guide': {
    sections: ['summary', 'requirements', 'process', 'resources', 'disclaimer'],
    affiliate: 'zero',
    safety: false,
  },
  'community-roundup': {
    sections: ['trends', 'opinions', 'expert_takes', 'recommendations'],
    affiliate: 'low',
    safety: false,
  },
};

const titleLanguage = (language: 'en' | 'tr') => (language === 'tr' ? 'Turkish' : 'English');

const WORKFLOW_CONTENT_TYPES: Record<ContentGenerationTemplate, string> = {
  'tech-article': 'tutorial',
  'product-review': 'review',
  'build-guide': 'build-guide',
  comparison: 'comparison',
  troubleshooting: 'tutorial',
  'regulation-guide': 'news',
  'community-roundup': 'news',
};

export function normalizeContentGenerationTemplate(template: string): ContentGenerationTemplate {
  if (template === 'product-review') return 'product-review';
  if (template === 'build-guide') return 'build-guide';
  if (template === 'comparison') return 'comparison';
  if (template === 'troubleshooting') return 'troubleshooting';
  if (template === 'regulation-guide') return 'regulation-guide';
  if (template === 'community-roundup') return 'community-roundup';
  return 'tech-article';
}

function buildFallbackPrompt(input: {
  topic: string;
  title: string;
  category: string;
  template: string;
  language: 'en';
  brief: {
    primaryKeyword: string;
    secondaryKeywords: readonly string[];
    summary: string;
    outline: readonly string[];
  };
}) {
  const template = normalizeContentGenerationTemplate(input.template);
  const config = TEMPLATES[template];
  return `You are FPVLovers' editorial content engine.

Topic: ${input.topic}
Title: ${input.title}
Category: ${input.category}
Primary keyword: ${input.brief.primaryKeyword}
Secondary keywords: ${input.brief.secondaryKeywords.join(', ')}
Summary: ${input.brief.summary}
Outline: ${input.brief.outline.join(' | ')}

Generate only valid JSON with:
- title
- seo { slug, metaDescription, keywords }
- excerpt
- body_sections [{ id, title, content }]
- internal_links
- publish_notes

Rules:
- Language: English (STRICTLY ENGLISH, NEVER TURKISH)
- Technical terms stay in English
- ${config.safety ? 'Include relevant safety warnings where appropriate.' : 'No safety warning section required.'}
- ${config.affiliate !== 'zero' ? `Affiliate density: ${config.affiliate}. Include product CTAs naturally.` : 'Do not include affiliate links in this content type.'}
- Use these canonical section hints: ${config.sections.join(', ')}
- Output ONLY valid JSON, no markdown wrappers.`;
}

function buildSections(sections: readonly string[]) {
  return sections.map((section) => ({
    id: section,
    title: section.replace(/_/g, ' '),
    content: 'section text',
  }));
}

async function readWorkflowStream(resp: Response): Promise<{
  workflowRunId: string | null;
  totalTokens: number | null;
  elapsedTime: number | null;
  outputs: Record<string, unknown>;
}> {
  const reader = resp.body?.getReader();
  if (!reader) {
    throw new Error('DIFY_STREAM_NO_BODY');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let workflowRunId: string | null = null;
  let totalTokens: number | null = null;
  let elapsedTime: number | null = null;
  let outputs: Record<string, unknown> = {};

  const handlePayload = (payload: any) => {
    workflowRunId = String(payload?.workflow_run_id || payload?.data?.id || workflowRunId || '') || null;
    const data = payload?.data || payload;
    if (typeof data?.total_tokens !== 'undefined') totalTokens = Number(data.total_tokens) || totalTokens;
    if (typeof data?.elapsed_time !== 'undefined') elapsedTime = Number(data.elapsed_time) || elapsedTime;
    if (data?.outputs && typeof data.outputs === 'object') {
      outputs = { ...outputs, ...data.outputs };
    }
    if (payload?.outputs && typeof payload.outputs === 'object') {
      outputs = { ...outputs, ...payload.outputs };
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });

    let splitIndex = buffer.indexOf('\n\n');
    while (splitIndex !== -1) {
      const block = buffer.slice(0, splitIndex).trim();
      buffer = buffer.slice(splitIndex + 2);
      if (block) {
        const dataLine = block
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line.startsWith('data:'));
        if (dataLine) {
          const raw = dataLine.replace(/^data:\s*/, '');
          try {
            const payload = JSON.parse(raw);
            handlePayload(payload);
            if (payload?.event === 'workflow_finished') {
              reader.cancel().catch(() => {});
              return { workflowRunId, totalTokens, elapsedTime, outputs };
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
      splitIndex = buffer.indexOf('\n\n');
    }

    if (done) break;
  }

  return { workflowRunId, totalTokens, elapsedTime, outputs };
}

export async function generateContentViaDify(input: ContentGenerationRequest): Promise<ContentGenerationResult> {
  const template = normalizeContentGenerationTemplate(input.template);
  const config = TEMPLATES[template];
  const keyword = input.brief?.primaryKeyword || input.topic;
  const contentType = WORKFLOW_CONTENT_TYPES[template];
  const wordCount = Number.isFinite(input.wordCount) && (input.wordCount as number) > 0 ? Math.round(input.wordCount as number) : 1500;
  const baseKeyword = input.customPrompt ? `${keyword} | ${input.customPrompt}` : keyword;
  const workflowKeyword = `${baseKeyword} | CRITICAL: The entire article MUST be written in strictly English. DO NOT USE TURKISH.`;

  const appKey = getRequiredEnv('DIFY_APP_KEY');
  const resp = await fetch(`${BASE}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        keyword: workflowKeyword,
        content_type: contentType,
        word_count: wordCount,
      },
      response_mode: 'streaming',
      user: 'content-orchestrator',
    }),
    signal: AbortSignal.timeout(300000),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown');
    throw new Error(`DIFY_API_${resp.status}: ${err.slice(0, 300)}`);
  }

  const streamed = await readWorkflowStream(resp);
  const outputs = streamed.outputs;
  const article = typeof outputs.article === 'string' ? outputs.article : '';
  const metadataRaw = typeof outputs.metadata === 'string' ? outputs.metadata : '';
  const outlineRaw = typeof outputs.outline === 'string' ? outputs.outline : '';
  const schemaRaw = typeof outputs.schema === 'string' ? outputs.schema : '';
  const affiliateRaw = typeof outputs.affiliate_data === 'string' ? outputs.affiliate_data : '';
  const seoResearch = typeof outputs.seo_research === 'string' ? outputs.seo_research : '';
  const rawAnswer = [article, metadataRaw, outlineRaw, schemaRaw, affiliateRaw, seoResearch]
    .filter(Boolean)
    .join('\n\n---\n\n') || JSON.stringify(outputs, null, 2);

  const parsedMetadata = (() => {
    try {
      return metadataRaw ? JSON.parse(metadataRaw) as {
        seo_title?: unknown;
        meta_description?: unknown;
        primary_keywords?: unknown;
        secondary_keywords?: unknown;
        slug?: unknown;
      } : null;
    } catch {
      return null;
    }
  })();

  const title = String(parsedMetadata?.seo_title || input.title || input.topic || template).trim();
  const slug = String(parsedMetadata?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).trim();
  const metaDescription = String(parsedMetadata?.meta_description || input.brief?.summary || input.topic).trim();
  const primaryKeywords = Array.isArray(parsedMetadata?.primary_keywords) ? parsedMetadata.primary_keywords : [];
  const secondaryKeywords = Array.isArray(parsedMetadata?.secondary_keywords) ? parsedMetadata.secondary_keywords : [];
  const keywords = [...primaryKeywords, ...secondaryKeywords]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  const content = article
    ? {
        title,
        seo: {
          slug,
          metaDescription,
          keywords,
        },
        excerpt: metaDescription,
        bodySections: [
          {
            id: 'article',
            title,
            content: article,
          },
        ],
        internalLinks: [],
        publishNotes: [],
      }
    : null;

  const resources: Array<{ dataset: string; source: string; score: number }> = [];

  return {
    success: Boolean(content || rawAnswer),
    template,
    content,
    rawAnswer,
    sources: resources,
    workflowRunId: streamed.workflowRunId,
    totalTokens: streamed.totalTokens,
    elapsedTime: streamed.elapsedTime,
    outputs,
  };
}

export async function runWorkflow(
  appToken: string,
  inputs: Record<string, unknown>,
): Promise<ContentGenerationResult> {
  const resp = await fetch(`${BASE}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      response_mode: 'blocking',
      user: 'fpvlovers-system',
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown');
    throw new Error(`DIFY_API_${resp.status}: ${err.slice(0, 300)}`);
  }

  const data = await resp.json();
  const workflowData = data?.data || {};
  const outputs: Record<string, unknown> = workflowData.outputs || {};

  return {
    success: workflowData.status === 'succeeded',
    template: 'tech-article',
    content: null,
    rawAnswer: JSON.stringify(outputs, null, 2),
    sources: [],
    workflowRunId: data.workflow_run_id || workflowData.id || null,
    totalTokens: workflowData.total_tokens ?? null,
    elapsedTime: workflowData.elapsed_time ?? null,
    outputs,
  };
}


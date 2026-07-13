import { getRequiredEnv } from '@/lib/env';
import { runWorkflow as runDifyWorkflow } from '@/lib/dify-client';
import { parseGeneratedContent, type GeneratedContent } from './parse-generated-content';

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
  error?: string | null;
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

export async function generateContentViaDify(input: ContentGenerationRequest): Promise<ContentGenerationResult> {
  const template = normalizeContentGenerationTemplate(input.template);
  const config = TEMPLATES[template];
  const keyword = input.brief?.primaryKeyword || input.topic;
  const contentType = WORKFLOW_CONTENT_TYPES[template];
  const wordCount = Number.isFinite(input.wordCount) && (input.wordCount as number) > 0 ? Math.round(input.wordCount as number) : 1500;
  const baseKeyword = input.customPrompt ? `${keyword} | ${input.customPrompt}` : keyword;
  const workflowKeyword = `${baseKeyword} | CRITICAL: The entire article MUST be written in strictly English. DO NOT USE TURKISH.`;

  const appKey = getRequiredEnv('DIFY_APP_KEY');
  const workflow = await runDifyWorkflow(
    'content-orchestrator',
    {
      keyword: workflowKeyword,
      content_type: contentType,
      word_count: wordCount,
    },
    appKey,
    'content_gen',
    180000,
  );

  if (!workflow.success) {
    throw new Error(`DIFY_WORKFLOW_${workflow.status}: ${workflow.error || 'Workflow did not succeed'}`);
  }

  const outputs = workflow.outputs;
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
    workflowRunId: workflow.workflowRunId || null,
    totalTokens: workflow.totalTokens || null,
    elapsedTime: workflow.elapsedTime || null,
    outputs,
    error: workflow.error || null,
  };
}

export async function runWorkflow(
  appToken: string,
  inputs: Record<string, unknown>,
): Promise<ContentGenerationResult> {
  const workflow = await runDifyWorkflow('fpvlovers-system', inputs, appToken, 'content_gen');
  const outputs = workflow.outputs;

  return {
    success: workflow.success,
    template: 'tech-article',
    content: null,
    rawAnswer: JSON.stringify(outputs, null, 2),
    sources: [],
    workflowRunId: workflow.workflowRunId || null,
    totalTokens: workflow.totalTokens || null,
    elapsedTime: workflow.elapsedTime || null,
    outputs,
    error: workflow.error || null,
  };
}

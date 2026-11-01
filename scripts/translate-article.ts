import fs from 'fs';
import path from 'path';
import { getPublishedContentBySlug } from '../src/lib/content-automation/content-reader';
import { isRegulationContent } from '../src/lib/content-automation/editorial-governance';
import {
  LOCALIZER_PROMPT_VERSION,
  buildLocalizedContent,
  parseLocalizedRewriteOutput,
  runLocalizedRewrite,
  validateLocalizedRewrite,
  type LocalizerSource,
} from '../src/lib/content-automation/localized-rewrite';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';
import { computeSeoScore } from '../src/lib/content-automation/seo-score';
import type { ContentJob, ContentTemplate } from '../src/lib/content-automation/types';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[key] = val;
  }
}

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const TEMPLATES: readonly ContentTemplate[] = [
  'tech-article',
  'product-review',
  'build-guide',
  'comparison',
  'troubleshooting',
  'regulation-guide',
  'community-roundup',
];

async function main() {
  loadEnvLocal();

  const slug = arg('slug');
  const fromFile = arg('from-file');
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  if (!slug) {
    throw new Error('Usage: pnpm content:translate --slug=<english-slug> [--dry-run] [--from-file=<localizer.json>] [--force] [--files-only]');
  }
  if (hasFlag('files-only')) {
    process.env.FPV_STORAGE_MODE = 'files';
  }

  const source = getPublishedContentBySlug(slug, 'en');
  if (!source) {
    throw new Error(`English artifact not found: content/published/${slug}.json`);
  }
  if (getPublishedContentBySlug(slug, 'tr') && !force) {
    throw new Error(`Turkish artifact already exists for ${slug}; pass --force to overwrite.`);
  }

  const template: ContentTemplate = TEMPLATES.includes(source.template as ContentTemplate)
    ? (source.template as ContentTemplate)
    : 'tech-article';

  if (source.editorial?.contentClass === 'product-review' || source.metadata?.contentType === 'review') {
    throw new Error('Product reviews require a human editor in the target language; machine translation is blocked.');
  }
  if (isRegulationContent({ category: source.category, template })) {
    throw new Error('Regulation content is generated from the Turkish RAG lane (C3), never machine-translated.');
  }

  const sourceReferences = (source.sourceReferences || []).filter((value) => /^https?:\/\//i.test(value));
  const localizerSource: LocalizerSource = {
    slug: source.slug,
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    contentType: source.metadata?.contentType || 'guide',
    metadata: source.metadata,
    bodySections: (source.bodySections || []).map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content,
      imageMatch: section.imageMatch,
    })),
    internalLinks: source.internalLinks || [],
    sourceReferences,
  };

  const parsed = fromFile
    ? parseLocalizedRewriteOutput(fs.readFileSync(path.resolve(fromFile), 'utf8'))
    : await runLocalizedRewrite(localizerSource);
  if (!parsed) {
    throw new Error('Localizer output could not be parsed as JSON.');
  }

  const validation = validateLocalizedRewrite(localizerSource, parsed);
  if (!validation.ok) {
    console.error('✗ Localizer output failed the publish gate:');
    for (const blocker of validation.blockers) {
      console.error(`  - ${blocker}`);
    }
    process.exit(1);
  }

  const content = buildLocalizedContent(parsed.content, localizerSource);
  const words = content.bodySections.reduce(
    (total, section) => total + section.content.split(/\s+/).filter(Boolean).length,
    0,
  );
  const seo = computeSeoScore(content);

  console.log(`✓ Gate passed: ${source.slug} → tr (${words} words, SEO ${seo.score})`);
  console.log(`  sections: ${content.bodySections.map((section) => section.id).join(', ')}`);
  console.log(`  notes: ${parsed.localizationNotes.join(' | ') || '(none)'}`);

  if (dryRun) {
    console.log('Dry run: no files written.');
    return;
  }

  const now = new Date().toISOString();
  const job: ContentJob = {
    id: `localize-${source.slug}-${Date.now().toString(36)}`,
    briefSlug: source.slug,
    title: content.title,
    category: source.category,
    status: 'published',
    topic: source.excerpt,
    language: 'tr',
    template,
    promptVersion: LOCALIZER_PROMPT_VERSION,
    sourceHints: sourceReferences,
    seo: content.seo,
    createdAt: now,
    updatedAt: now,
  };

  const publishedFile = await publishGeneratedContentArtifact(source.slug, job, content, {
    locale: 'tr',
    translationOf: source.slug,
    metadata: parsed.metadata,
    sourceReferences,
  });
  console.log(`✓ Published ${publishedFile}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

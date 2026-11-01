import fs from 'fs';
import path from 'path';
import { publishGeneratedContentArtifact } from '../src/lib/content-automation/publish-artifact';
import { getPublishedContentBySlug, getArtifactWordCount } from '../src/lib/content-automation/content-reader';
import {
  toGeneratedContent,
  validateOriginalArticle,
  type OriginalArticleInput,
} from '../src/lib/content-automation/original-article';
import { computeSeoScore } from '../src/lib/content-automation/seo-score';
import type { ContentJob } from '../src/lib/content-automation/types';

const ORIGINAL_PROMPT_VERSION = 'editorial-original-v1';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const file = arg('file');
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  if (!file) {
    throw new Error('Usage: pnpm content:publish-original --file=<article.json> [--dry-run] [--files-only] [--force]');
  }
  if (hasFlag('files-only')) {
    process.env.FPV_STORAGE_MODE = 'files';
  }

  const input = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as OriginalArticleInput;
  if (getPublishedContentBySlug(input.slug, 'tr') && !force) {
    throw new Error(`Turkish artifact already exists for ${input.slug}; pass --force to overwrite.`);
  }

  const validation = validateOriginalArticle(input);
  if (!validation.ok) {
    console.error('✗ Original article failed the publish gate:');
    for (const blocker of validation.blockers) console.error(`  - ${blocker}`);
    process.exit(1);
  }

  const content = toGeneratedContent(input);
  const words = getArtifactWordCount(content);
  const seo = computeSeoScore(content);
  console.log(`✓ Gate passed: tr/${input.slug} (${words} words, SEO ${seo.score})`);
  console.log(`  sections: ${content.bodySections.map((section) => section.id).join(', ')}`);

  if (dryRun) {
    console.log('Dry run: no files written.');
    return;
  }

  const now = new Date().toISOString();
  const job: ContentJob = {
    id: `original-tr-${input.slug}-${Date.now().toString(36)}`,
    briefSlug: input.slug,
    title: content.title,
    category: input.category,
    status: 'published',
    topic: content.excerpt,
    language: 'tr',
    template: input.template,
    promptVersion: ORIGINAL_PROMPT_VERSION,
    sourceHints: [],
    seo: content.seo,
    createdAt: now,
    updatedAt: now,
  };

  const publishedFile = await publishGeneratedContentArtifact(input.slug, job, content, {
    locale: 'tr',
    origin: 'tr',
    metadata: input.metadata,
    sourceReferences: input.sourceReferences,
  });
  console.log(`✓ Published ${publishedFile}`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

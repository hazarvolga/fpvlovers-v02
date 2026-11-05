import assert from 'node:assert/strict';
import {
  completeGeneratedContent,
  normalizeMetaDescription,
  pickRelatedArticles,
} from '../src/lib/content-automation/complete-generated-content';
import { extractRetrievalSources } from '../src/lib/content-automation/retrieval-sources';
import { computeSeoScore } from '../src/lib/content-automation/seo-score';
import type { GeneratedContent } from '../src/lib/content-automation/parse-generated-content';

// --- meta description ---
const short = normalizeMetaDescription('Learn FPV landing approach practice step by step with safe drills for beginners.');
assert.ok(short.length >= 120 && short.length <= 160, `short meta expanded to range, got ${short.length}`);
const long = normalizeMetaDescription('word '.repeat(60));
assert.ok(long.length <= 160 && !long.endsWith(' '), `long meta trimmed, got ${long.length}`);
const ok = 'x'.repeat(10) + ' ' + 'y'.repeat(120);
assert.equal(normalizeMetaDescription(ok), ok, 'in-range meta is untouched');
const emptyMeta = normalizeMetaDescription('');
assert.ok(emptyMeta.length > 0 && emptyMeta.length <= 160, 'empty meta never invents a description, only the neutral filler');

// --- related articles ---
const related = pickRelatedArticles('FPV Landing Approach Practice Guide', [
  { slug: 'fpv-simulator-practice-plan', title: 'FPV Simulator Practice Plan' },
  { slug: 'lipo-battery-safety', title: 'LiPo Battery Safety' },
  { slug: 'landing-checklist', title: 'FPV Landing Checklist for Beginners' },
], 2);
assert.deepEqual(related.map((a) => a.slug), ['landing-checklist', 'fpv-simulator-practice-plan']);
assert.deepEqual(pickRelatedArticles('Totally unrelated', [{ slug: 'a', title: 'Zebra' }], 3), []);

// --- retrieval sources ---
const sources = extractRetrievalSources([
  { metadata: { dataset_name: 'fpv-community-knowledge', score: 0.58, doc_metadata: { source_url: 'https://fpvlovers.com.tr/guides/a' } } },
  { metadata: { dataset_name: 'fpv-community-knowledge', score: 0.5, doc_metadata: { source_url: 'https://fpvlovers.com.tr/guides/a' } } },
  { metadata: { dataset_name: 'x', score: 0.9, doc_metadata: {} } },
  { metadata: { dataset_name: 'x', score: 0.7, doc_metadata: { source_url: 'not a url' } } },
  'garbage',
]);
assert.deepEqual(sources, [{ dataset: 'fpv-community-knowledge', source: 'https://fpvlovers.com.tr/guides/a', score: 0.58 }]);
assert.deepEqual(extractRetrievalSources(undefined), []);

// --- completion ---
const words = Array.from({ length: 1700 }, (_, i) => (i % 40 === 0 ? 'landing' : 'word')).join(' ');
const raw: GeneratedContent = {
  title: 'FPV Landing Approach Practice Guide',
  seo: { slug: 'fpv-landing-approach-practice-guide', metaDescription: 'Learn FPV landing approach practice step by step with safe drills for beginners.', keywords: [] },
  excerpt: 'Learn FPV landing approach practice step by step with safe drills for beginners.',
  bodySections: [{ id: 'article', title: 'FPV Landing Approach Practice Guide', content: words }],
  internalLinks: [],
  publishNotes: [],
};
const before = computeSeoScore(raw).score;
const done = completeGeneratedContent(raw, {
  category: 'baslangic',
  keywords: ['landing', 'fpv landing practice'],
  relatedArticles: [{ slug: 'landing-checklist', title: 'FPV Landing Checklist for Beginners' }],
});
assert.deepEqual(done.seo.keywords, ['landing', 'fpv landing practice']);
assert.ok(done.seo.metaDescription.length >= 120 && done.seo.metaDescription.length <= 160);
assert.ok(done.internalLinks.includes('/guides') && done.internalLinks.includes('/article/landing-checklist'));
assert.ok(done.media?.coverImage.alt.length);
assert.ok(computeSeoScore(done).score > before, 'completion improves the score');
assert.ok(computeSeoScore(done).score >= 80, `score ${computeSeoScore(done).score} reaches the publish gate`);
assert.equal(raw.internalLinks.length, 0, 'input is not mutated');

const kept = completeGeneratedContent({ ...raw, seo: { ...raw.seo, keywords: ['own keyword'] } }, { category: 'x', keywords: ['other'], relatedArticles: [] });
assert.deepEqual(kept.seo.keywords, ['own keyword'], 'model keywords win when present');

console.log('Generated content completion regression test passed.');

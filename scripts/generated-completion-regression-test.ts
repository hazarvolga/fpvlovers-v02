import assert from 'node:assert/strict';
import {
  completeGeneratedContent,
  selectPrimaryKeyword,
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
assert.ok(kept.seo.keywords.includes('own keyword'), 'model keywords are kept when present');
assert.ok(!kept.seo.keywords.includes('other'), 'brief keywords are only a fallback when the model returned none');

// --- primary keyword selection ---
const body = 'Set up practice gates at home. '.repeat(10) + 'Fly around the practice gates slowly. '.repeat(8) + 'filler '.repeat(400);
const title = 'FPV Practice Gates at Home: A Beginner Training Setup';
const picked = selectPrimaryKeyword(title, body, ['FPV practice gates home', 'drone racing gates']);
assert.ok(title.toLowerCase().includes(picked.toLowerCase()), 'the primary keyword appears in the title');
assert.ok(body.toLowerCase().includes(picked.toLowerCase()), 'and in the body');
assert.notEqual(picked, 'FPV practice gates home', 'a phrase the article never uses is not chosen');

const modelFirst = selectPrimaryKeyword('Practice Gates', 'practice gates '.repeat(30) + 'filler '.repeat(1000), ['practice gates']);
assert.equal(modelFirst, 'practice gates', 'a good model keyword is kept');

const reordered = completeGeneratedContent(
  { ...raw, title, bodySections: [{ id: 'a', title, content: body }], seo: { ...raw.seo, keywords: ['FPV practice gates home', 'drone racing gates'] } },
  { category: 'x', keywords: [], relatedArticles: [] },
);
assert.equal(reordered.seo.keywords[0].toLowerCase(), picked.toLowerCase(), 'selected keyword leads the list');
assert.ok(reordered.seo.keywords.includes('drone racing gates'), 'model keywords are retained');

console.log('Generated content completion regression test passed.');

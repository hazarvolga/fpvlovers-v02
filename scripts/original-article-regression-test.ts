import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  toGeneratedContent,
  validateOriginalArticle,
  type OriginalArticleInput,
} from '../src/lib/content-automation/original-article';

// The grader counts the primary keyword as a plain substring of title + bodies,
// so the fixture repeats one 12-word sentence containing "drone kuralları" and
// dilutes it with 11-word neutral sentences. 12 keyword + 42 neutral per section
// yields 1818 body words and a 1.97% density — comfortably inside every band.
const keywordSentence = 'drone kuralları yeni pilotlar için temel bilgileri ve güvenli uçuş pratiklerini açıklar.';
const neutralSentence = 'pil güvenliği ve ekipman bakımı uzun uçuşlar için düzenli kontrol gerektirir.';

function body(keywordCount: number, neutralCount: number): string {
  return [...Array(keywordCount).fill(keywordSentence), ...Array(neutralCount).fill(neutralSentence)].join(' ');
}

const valid: OriginalArticleInput = {
  slug: 'shy-iha-drone-rules-for-beginners-in-turkey',
  // The title must contain the primary keyword verbatim; "SHY-İHA" lowercases to
  // "shy-i̇ha" (dotted İ + combining mark) and never matches the ASCII keyword.
  title: "SHY-İHA: Türkiye'de Drone Kuralları ve Yeni Başlayanlar İçin Uçuş Rehberi",
  excerpt: 'Türkiye’de İHA uçuşlarına başlamadan önce bilinmesi gereken resmî çerçevenin kaynaklı özeti.',
  category: 'Regulations',
  template: 'regulation-guide',
  seo: {
    metaDescription: 'SHY-İHA kapsamında yeni başlayanlar için kayıt, yeterlilik ve uçuş öncesi kontrolleri resmî kaynaklara dayanarak özetleyen başlangıç rehberi.',
    keywords: ['drone kuralları', 'shy iha', 'iha mevzuatı'],
  },
  bodySections: [
    { id: 'kapsam', title: 'Kapsam ve Tanımlar', content: body(12, 42) },
    { id: 'kayit', title: 'Kayıt ve Yeterlilik', content: body(12, 42) },
    { id: 'ucus', title: 'Uçuş Öncesi Kontroller', content: body(12, 42) },
  ],
  internalLinks: ['/regulations'],
  publishNotes: ['Türkçe özgün içerik; her iddia resmî SHGM kaynağına dayanır.'],
  metadata: {
    difficulty: 'beginner',
    contentType: 'reference',
    topics: ['regulations'],
    audience: ['new-pilot'],
    discipline: ['general'],
  },
  sourceReferences: ['https://web.shgm.gov.tr/'],
};

assert.deepEqual(validateOriginalArticle(valid).blockers, []);
assert.equal(validateOriginalArticle(valid).ok, true);

const englishBody: OriginalArticleInput = {
  ...valid,
  title: 'Turkish drone rules for beginners',
  excerpt: 'A sourced summary of the official framework before your first flight.',
  seo: {
    ...valid.seo,
    keywords: ['drone rules'],
    metaDescription: 'The pilot should check the battery and the radio before the first flight and follow the local aviation authority rules.',
  },
  bodySections: [
    { id: 'kapsam', title: 'Scope', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
    { id: 'kayit', title: 'Registration', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
    { id: 'ucus', title: 'Checks', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(80) },
  ],
};
assert.ok(validateOriginalArticle(englishBody).blockers.some((b) => b.includes('Turkish')));

const short: OriginalArticleInput = {
  ...valid,
  bodySections: [
    { id: 'kapsam', title: 'Kapsam', content: body(2, 2) },
    { id: 'kayit', title: 'Kayıt', content: body(2, 2) },
    { id: 'ucus', title: 'Uçuş', content: body(2, 2) },
  ],
};
assert.ok(validateOriginalArticle(short).blockers.some((b) => b.includes('1200')));

assert.ok(
  validateOriginalArticle({ ...valid, sourceReferences: [] }).blockers.some((b) => b.includes('source reference')),
);
assert.ok(
  validateOriginalArticle({ ...valid, sourceReferences: ['http://web.shgm.gov.tr/'] }).blockers.some((b) => b.includes('https')),
);
assert.ok(
  validateOriginalArticle({
    ...valid,
    bodySections: [
      { id: 'kapsam', title: 'Kapsam', content: body(10, 30) },
      { id: 'kapsam', title: 'Kayıt', content: body(10, 40) },
      { id: 'ucus', title: 'Uçuş', content: body(10, 40) },
    ],
  }).blockers.some((b) => b.includes('unique')),
);
assert.ok(
  validateOriginalArticle({
    ...valid,
    metadata: { ...valid.metadata, difficulty: 'legendary' as never },
  }).blockers.some((b) => b.includes('Metadata')),
);
assert.ok(
  // Dropping the keyword list leaves only words + meta + links (55), which is the
  // deterministic way to land under the gate: a title-only miss still scores 80.
  validateOriginalArticle({ ...valid, seo: { ...valid.seo, keywords: [] } }).blockers.some((b) => b.includes('SEO')),
);
assert.ok(
  validateOriginalArticle({ ...valid, template: 'product-review' as never }).blockers.some((b) => b.includes('template')),
);

const content = toGeneratedContent(valid);
assert.equal(content.seo.slug, valid.slug);
assert.equal(content.bodySections.length, 3);
assert.equal(content.internalLinks[0], '/regulations');

const script = fs.readFileSync('scripts/publish-original-article.ts', 'utf8');
assert.match(script, /origin: 'tr'/, 'the CLI must publish with an origin marker');
assert.match(script, /locale: 'tr'/);
assert.match(script, /--files-only/);

console.log('original article regression checks passed');

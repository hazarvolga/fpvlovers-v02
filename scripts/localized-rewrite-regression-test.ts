import assert from 'node:assert/strict';
import {
  buildLocalizedContent,
  buildLocalizerInputs,
  parseLocalizedRewriteOutput,
  validateLocalizedRewrite,
  type LocalizerSource,
} from '../src/lib/content-automation/localized-rewrite';

const keywordSentence = 'fpv başlangıç rehberi yeni pilotlar için temel bilgileri ve güvenli uçuş pratiklerini açıklar.';
const neutralSentence = 'Pil güvenliği ve ekipman bakımı uzun uçuşlar için her zaman düzenli kontrol gerektirir.';

function body(keywordCount: number, neutralCount: number): string {
  return [...Array(keywordCount).fill(keywordSentence), ...Array(neutralCount).fill(neutralSentence)].join(' ');
}

const sourceMetadata = {
  contentType: 'tutorial' as const,
  difficulty: 'beginner' as const,
  topics: ['setup'],
  audience: ['new-pilot' as const],
  discipline: ['general' as const],
};

const source: LocalizerSource = {
  slug: 'fpv-kit',
  title: 'FPV Starter Kit',
  excerpt: 'A starter guide for new pilots.',
  category: 'Flight Guides',
  contentType: 'tutorial',
  metadata: sourceMetadata,
  bodySections: [
    { id: 'intro', title: 'Intro', content: 'Intro body.' },
    { id: 'steps', title: 'Steps', content: 'Steps body.' },
  ],
  internalLinks: ['/article/fpv-kit'],
  sourceReferences: ['https://example.com/spec'],
};

const goodOutput = {
  title: 'FPV Başlangıç Rehberi: İlk Uçuşa Güvenli Başlangıç',
  excerpt: 'Yeni pilotlar için temel FPV bilgileri ve güvenli uçuş pratikleri.',
  body_sections: [
    { id: 'intro', title: 'Başlangıç', content: body(15, 45) },
    { id: 'steps', title: 'Adımlar', content: body(15, 65) },
  ],
  seo: {
    slug: 'fpv-kit',
    metaDescription: 'FPV başlangıç rehberi: ilk drone seçimi, kumanda ayarı, simülatör çalışması ve güvenli ilk uçuş için adım adım temel bilgiler.',
    keywords: ['fpv başlangıç', 'fpv drone', 'yeni pilot'],
  },
  metadata: sourceMetadata,
  internal_links: ['/article/fpv-kit'],
  publish_notes: ['Türkçe yerelleştirme'],
  localization_notes: ['FPV terimleri korundu'],
};

const wrap = (value: unknown) => '```json\n' + JSON.stringify(value) + '\n```';

const inputs = buildLocalizerInputs(source);
assert.equal(inputs.source_slug, 'fpv-kit');
assert.equal(inputs.target_locale, 'tr');
assert.match(inputs.source_body, /## Intro/);

const parsed = parseLocalizedRewriteOutput(wrap(goodOutput));
assert.ok(parsed, 'fenced JSON must parse');
assert.equal(parsed.metadata.difficulty, 'beginner');
assert.deepEqual(parsed.localizationNotes, ['FPV terimleri korundu']);

const accepted = validateLocalizedRewrite(source, parsed);
assert.deepEqual(accepted.blockers, []);
assert.equal(accepted.ok, true);

const slugDrift = parseLocalizedRewriteOutput(wrap({ ...goodOutput, seo: { ...goodOutput.seo, slug: 'drifted' } }));
assert.ok(slugDrift);
assert.ok(validateLocalizedRewrite(source, slugDrift).blockers.some((blocker) => blocker.includes('Slug mismatch')));

const sectionDrift = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  body_sections: [{ id: 'intro', title: 'Başlangıç', content: body(30, 110) }],
}));
assert.ok(sectionDrift);
assert.ok(validateLocalizedRewrite(source, sectionDrift).blockers.some((blocker) => blocker.includes('Section ids drifted')));

const englishBody = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  title: 'FPV Starter Guide',
  excerpt: 'A starter guide.',
  seo: { ...goodOutput.seo, metaDescription: 'A starter guide for new pilots who want to learn the basics before the first flight.' },
  body_sections: [
    { id: 'intro', title: 'Intro', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(60) },
    { id: 'steps', title: 'Steps', content: 'The pilot should check the battery and the radio before the first flight. '.repeat(60) },
  ],
}));
assert.ok(englishBody);
assert.ok(validateLocalizedRewrite(source, englishBody).blockers.some((blocker) => blocker.includes('English')));

const shortBody = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  body_sections: [
    { id: 'intro', title: 'Başlangıç', content: body(5, 5) },
    { id: 'steps', title: 'Adımlar', content: body(5, 5) },
  ],
}));
assert.ok(shortBody);
assert.ok(validateLocalizedRewrite(source, shortBody).blockers.some((blocker) => blocker.includes('1200')));

const metadataDrift = parseLocalizedRewriteOutput(wrap({
  ...goodOutput,
  metadata: { ...sourceMetadata, difficulty: 'advanced' },
}));
assert.ok(metadataDrift);
assert.ok(validateLocalizedRewrite(source, metadataDrift).blockers.some((blocker) => blocker.includes('difficulty drifted')));

const imageSource: LocalizerSource = {
  ...source,
  bodySections: [
    { id: 'intro', title: 'Intro', content: 'Intro body.', imageMatch: { src: '/images/intro.jpg', alt: 'Intro' } },
    { id: 'steps', title: 'Steps', content: 'Steps body.' },
  ],
};
const withImages = buildLocalizedContent(parsed.content, imageSource);
assert.equal(withImages.bodySections[0].imageMatch?.src, '/images/intro.jpg');
assert.equal(withImages.bodySections[1].imageMatch, undefined);

console.log('localized rewrite regression checks passed');

import {
  getArtifactWordCount,
  getPublishedContentBySlug,
  isCommercialArtifact,
  listPublishedContent,
} from '../src/lib/content-automation/content-reader';

const MIN_WORDS = 600;
const MIN_INTERNAL_LINKS = 2;

const published = listPublishedContent();
const publishedSlugs = new Set(published.map((article) => article.slug));
const commercial = published.filter(isCommercialArtifact);
const failures: string[] = [];
const enrichmentCandidates: Array<{ slug: string; words: number }> = [];

function fail(slug: string, message: string): void {
  failures.push(`${slug}: ${message}`);
}

for (const article of commercial) {
  const words = getArtifactWordCount(article);
  if (words < MIN_WORDS) {
    fail(article.slug, `body is ${words} words; minimum is ${MIN_WORDS}`);
  }
  if (words < 1200) {
    enrichmentCandidates.push({ slug: article.slug, words });
  }

  const internalLinks = Array.isArray(article.internalLinks) ? article.internalLinks : [];
  if (internalLinks.length < MIN_INTERNAL_LINKS) {
    fail(article.slug, `only ${internalLinks.length} internal links; minimum is ${MIN_INTERNAL_LINKS}`);
  }
  for (const link of internalLinks) {
    if (!link.startsWith('/article/')) continue;
    const targetSlug = link.slice('/article/'.length).split('#')[0];
    if (!publishedSlugs.has(targetSlug) && !getPublishedContentBySlug(targetSlug)) {
      fail(article.slug, `broken internal article link: ${link}`);
    }
  }

  const editorial = article.editorial;
  if (!editorial) {
    fail(article.slug, 'missing editorial record');
    continue;
  }

  if (article.metadata?.contentType === 'review') {
    if (editorial.contentClass !== 'product-review' || editorial.approvalStatus !== 'approved') {
      fail(article.slug, 'review must be approved with product-review content class');
    }
    if (!Array.isArray(editorial.evidenceSources) || editorial.evidenceSources.length === 0) {
      fail(article.slug, 'review has no evidence source');
    }
    if (editorial.testingMethod === 'hands-on') {
      if (!editorial.editorName || !editorial.reviewedAt || editorial.productRelationship === 'none') {
        fail(article.slug, 'hands-on review requires editor, review date, and product relationship');
      }
    } else if (editorial.testingMethod === 'spec-analysis') {
      const disclosure = editorial.disclosure?.toLocaleLowerCase('en-US') || '';
      if (!disclosure.includes('specification-based') || !disclosure.includes('not a hands-on')) {
        fail(article.slug, 'spec-analysis review must disclose that it is not hands-on');
      }
    } else {
      fail(article.slug, 'review is missing testing method');
    }
  } else if (editorial.contentClass !== 'autonomous' || editorial.disclosurePresent !== true) {
    fail(article.slug, 'autonomous commercial content must declare disclosurePresent=true');
  }
}

console.log(`commercial artifacts checked: ${commercial.length}`);
console.log(`hard gate: ${MIN_WORDS}+ words, ${MIN_INTERNAL_LINKS}+ internal links, disclosure and evidence`);
if (enrichmentCandidates.length > 0) {
  console.log(
    `enrichment backlog (<1200 words, non-blocking): ${enrichmentCandidates
      .map((candidate) => `${candidate.slug} (${candidate.words})`)
      .join(', ')}`,
  );
}

if (failures.length > 0) {
  console.error('\ncommercial readiness regression failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('commercial readiness regression passed');

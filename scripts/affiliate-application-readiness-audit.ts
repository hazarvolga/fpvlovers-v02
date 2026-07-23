import fs from 'node:fs';
import path from 'node:path';
import {
  getArtifactWordCount,
  isCommercialArtifact,
  listPublishedContent,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';

type RecordLike = Record<string, unknown>;

const MIN_COMMERCIAL_ARTIFACTS = 15;
const MIN_BUYER_GUIDES = 6;
const MIN_COMPARISONS = 3;
const MIN_REVIEWS = 4;
const MIN_COMMERCIAL_WORDS = 600;
const MIN_INTERNAL_LINKS = 2;

const requiredTrustRoutes = [
  { route: '/about', file: 'src/app/about/page.tsx' },
  { route: '/contact', file: 'src/app/contact/page.tsx' },
  { route: '/privacy', file: 'src/app/privacy/page.tsx' },
  { route: '/terms', file: 'src/app/terms/page.tsx' },
  { route: '/disclosure', file: 'src/app/disclosure/page.tsx' },
  { route: '/editorial-policy', file: 'src/app/editorial-policy/page.tsx' },
  { route: '/advertise', file: 'src/app/advertise/page.tsx' },
  { route: '/sitemap.xml', file: 'src/app/sitemap.xml/route.ts' },
  { route: '/robots.txt', file: 'src/app/robots.ts' },
] as const;

const publicClaimFiles = [
  'src/app',
  'src/features',
  'content/published',
] as const;

const riskyPublicClaimPatterns = [
  /Amazon Associate[s]?\b/i,
  /\bofficial affiliate partner\b/i,
  /\bofficial sponsor\b/i,
  /\bpartnered with\b/i,
  /\bsponsored by\b/i,
  /\b(?:product|unit|sample)\s+(?:was\s+)?provided by\b/i,
  /\bsent us\b/i,
  /\bwe tested\b/i,
  /\bour test\b/i,
  /\bhands[- ]on tested\b/i,
  /\bthis is a hands[- ]on review\b/i,
] as const;

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')) as unknown;
}

function readIfExists(file: string): string {
  const fullPath = path.join(process.cwd(), file);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

function walkFiles(target: string): string[] {
  const fullPath = path.join(process.cwd(), target);
  if (!fs.existsSync(fullPath)) return [];
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [target];
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next')) return [];
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) return walkFiles(child);
    if (!/\.(tsx?|md|json)$/i.test(entry.name)) return [];
    return [child];
  });
}

function classifyContentType(article: PublishedArtifact): string {
  return article.metadata?.contentType || article.template || 'article';
}

function evidenceUrls(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isHttpUrl) : [];
}

function assertGate(condition: boolean, message: string, failures: string[]): void {
  if (!condition) failures.push(message);
}

const published = listPublishedContent();
const publishedSlugs = new Set(published.map((article) => article.slug));
const commercial = published.filter(isCommercialArtifact);
const commercialByType = commercial.reduce<Record<string, number>>((acc, article) => {
  const type = classifyContentType(article);
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {});

const failures: string[] = [];
const warnings: string[] = [];

for (const trustRoute of requiredTrustRoutes) {
  assertGate(
    fs.existsSync(path.join(process.cwd(), trustRoute.file)),
    `missing trust route file: ${trustRoute.route} (${trustRoute.file})`,
    failures,
  );
}

assertGate(commercial.length >= MIN_COMMERCIAL_ARTIFACTS, `commercial artifacts ${commercial.length}; minimum ${MIN_COMMERCIAL_ARTIFACTS}`, failures);
assertGate((commercialByType['buyer-guide'] || 0) >= MIN_BUYER_GUIDES, `buyer guides ${commercialByType['buyer-guide'] || 0}; minimum ${MIN_BUYER_GUIDES}`, failures);
assertGate((commercialByType.comparison || 0) >= MIN_COMPARISONS, `comparisons ${commercialByType.comparison || 0}; minimum ${MIN_COMPARISONS}`, failures);
assertGate((commercialByType.review || 0) >= MIN_REVIEWS, `reviews ${commercialByType.review || 0}; minimum ${MIN_REVIEWS}`, failures);

for (const article of commercial) {
  const words = getArtifactWordCount(article);
  assertGate(words >= MIN_COMMERCIAL_WORDS, `${article.slug}: ${words} words; minimum ${MIN_COMMERCIAL_WORDS}`, failures);

  const internalLinks = Array.isArray(article.internalLinks) ? article.internalLinks : [];
  assertGate(internalLinks.length >= MIN_INTERNAL_LINKS, `${article.slug}: ${internalLinks.length} internal links; minimum ${MIN_INTERNAL_LINKS}`, failures);
  for (const link of internalLinks) {
    if (!link.startsWith('/article/')) continue;
    const linkedSlug = link.slice('/article/'.length).split('#')[0];
    assertGate(publishedSlugs.has(linkedSlug), `${article.slug}: broken internal article link ${link}`, failures);
  }

  if (!article.editorial) {
    failures.push(`${article.slug}: missing editorial record`);
    continue;
  }

  if (article.metadata?.contentType === 'review') {
    const editorial = article.editorial;
    assertGate(editorial.contentClass === 'product-review', `${article.slug}: review must use product-review editorial class`, failures);
    assertGate(editorial.approvalStatus === 'approved', `${article.slug}: review must be approved`, failures);
    assertGate(Array.isArray(editorial.evidenceSources) && editorial.evidenceSources.length > 0, `${article.slug}: review needs evidence sources`, failures);
    if (editorial.contentClass === 'product-review' && editorial.testingMethod === 'hands-on') {
      assertGate(editorial.editorName === 'Hazar Volga Ekiz', `${article.slug}: hands-on review must name Hazar Volga Ekiz as editor`, failures);
      assertGate(Boolean(editorial.reviewedAt), `${article.slug}: hands-on review needs reviewedAt`, failures);
      assertGate(editorial.productRelationship !== 'none', `${article.slug}: hands-on review needs product relationship evidence`, failures);
    }
    if (editorial.contentClass === 'product-review' && editorial.testingMethod === 'spec-analysis') {
      const disclosure = editorial.disclosure?.toLocaleLowerCase('en-US') || '';
      assertGate(
        disclosure.includes('specification-based') && disclosure.includes('not a hands-on'),
        `${article.slug}: spec-analysis review needs no-hands-on disclosure`,
        failures,
      );
    }
  } else {
    assertGate(article.editorial.contentClass === 'autonomous', `${article.slug}: non-review commercial content must be autonomous`, failures);
    assertGate(article.editorial.contentClass === 'autonomous' && article.editorial.disclosurePresent === true, `${article.slug}: autonomous commercial content needs disclosurePresent=true`, failures);
  }
}

const affiliatesRaw = readJson('data/affiliates.json');
const affiliateRows = Array.isArray(affiliatesRaw)
  ? affiliatesRaw.map(asRecord).filter((row): row is RecordLike => Boolean(row))
  : [];
const activeAffiliateRows = affiliateRows.filter((row) => asBoolean(row.active));
const explicitlyVerifiedRows = activeAffiliateRows.filter((row) => asBoolean(row.affiliateUrlVerified));
const invalidVerifiedRows = explicitlyVerifiedRows.filter((row) =>
  !isHttpUrl(row.url) || evidenceUrls(row.verificationEvidence).length === 0,
);
const eligibleAffiliateRows = explicitlyVerifiedRows.filter((row) =>
  isHttpUrl(row.url) && evidenceUrls(row.verificationEvidence).length > 0,
);

assertGate(invalidVerifiedRows.length === 0, `invalid explicitly verified affiliate rows: ${invalidVerifiedRows.map((row) => asString(row.id) || 'unknown').join(', ')}`, failures);

if (eligibleAffiliateRows.length === 0) {
  warnings.push('No affiliate rows are verified for live CTA activation yet. This is expected before program acceptance and does not block application readiness.');
}

const publicClaimMatches = publicClaimFiles
  .flatMap(walkFiles)
  .flatMap((file) => {
    const text = readIfExists(file);
    return riskyPublicClaimPatterns.flatMap((pattern) => {
      const match = text.match(pattern);
      return match ? [`${file}: ${match[0]}`] : [];
    });
  });

assertGate(publicClaimMatches.length === 0, `unsupported public commercial/testing claims: ${publicClaimMatches.join('; ')}`, failures);

const difyFallbackText = readIfExists('src/lib/dify.ts');
assertGate(!/affiliateLink:\s*['"]https?:\/\//i.test(difyFallbackText), 'legacy Dify fallback must not hard-code affiliate links', failures);

const articlePageText = readIfExists('src/app/article/[slug]/page.tsx');
assertGate(articlePageText.includes('commerceVerified === true'), 'article fallback CTA must be gated by commerceVerified === true', failures);
assertGate(articlePageText.includes('Commercial CTA Locked'), 'article fallback must render a locked commercial CTA state when unverified', failures);

const score = failures.length === 0 ? 100 : Math.max(0, 100 - failures.length * 10);
const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? 'passed' : 'failed',
  applicationReady: failures.length === 0,
  affiliateApplicationReadinessScore: score,
  ctaActivationReady: eligibleAffiliateRows.length > 0,
  counts: {
    publishedArtifacts: published.length,
    commercialArtifacts: commercial.length,
    commercialByType,
    activeAffiliateRows: activeAffiliateRows.length,
    explicitlyVerifiedAffiliateRows: explicitlyVerifiedRows.length,
    eligibleAffiliateRows: eligibleAffiliateRows.length,
    requiredTrustRoutes: requiredTrustRoutes.length,
  },
  warnings,
  failures,
  policyBoundary: [
    'Affiliate program application readiness is separate from live affiliate CTA activation.',
    'No active partnership, Amazon Associate status, supplied product, or hands-on test claim is assumed.',
    'Verified affiliate CTAs require affiliateUrlVerified=true and HTTP(S) verification evidence.',
  ],
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) process.exit(1);
console.log('affiliate application readiness audit passed');

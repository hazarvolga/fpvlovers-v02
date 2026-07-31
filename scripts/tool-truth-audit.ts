import './load-local-env';
import type { DatasetInfo, DifyAppInfo } from '../src/lib/master-routing-tables';
import type { FpvCatalogProduct } from '../src/lib/tools/fpv-product-types';
import fs from 'fs';
import path from 'path';

type AuditStatus = 'PASS' | 'PARTIAL' | 'DEFERRED' | 'FAIL';

type CatalogModule = {
  getFpvProductCatalog?: () => FpvCatalogProduct[];
  default?: {
    getFpvProductCatalog?: () => FpvCatalogProduct[];
  };
};

type RoutingModule = {
  DATASETS?: DatasetInfo[];
  DIFY_APPS?: DifyAppInfo[];
  default?: {
    DATASETS?: DatasetInfo[];
    DIFY_APPS?: DifyAppInfo[];
  };
};

type AuditRow = {
  tool: string;
  status: AuditStatus;
  dataSource: string;
  finding: string;
  nextAction: string;
};

const strict = process.argv.includes('--strict');

async function main() {
const catalogModule = await import('../src/lib/tools/fpv-product-catalog') as CatalogModule;
const routingModule = await import('../src/lib/master-routing-tables') as RoutingModule;

const getFpvProductCatalog = catalogModule.getFpvProductCatalog
  ?? catalogModule.default?.getFpvProductCatalog;

const datasets = routingModule.DATASETS ?? routingModule.default?.DATASETS ?? [];
const difyApps = routingModule.DIFY_APPS ?? routingModule.default?.DIFY_APPS ?? [];

if (!getFpvProductCatalog) {
  throw new Error('getFpvProductCatalog export not found.');
}

// datasets is still used for routing config validation
void datasets;

function hasDifyApp(name: string): boolean {
  return Boolean(difyApps.find((app) => app.name === name)?.token);
}

function typeCount(products: FpvCatalogProduct[]): Record<string, number> {
  return products.reduce<Record<string, number>>((counts, product) => {
    counts[product.type] = (counts[product.type] ?? 0) + 1;
    return counts;
  }, {});
}

function localPublishedToolCorpus(): { build: number; tuning: number; total: number } {
  const publishedDir = path.join(process.cwd(), 'content', 'published');
  if (!fs.existsSync(publishedDir)) return { build: 0, tuning: 0, total: 0 };

  let build = 0;
  let tuning = 0;
  for (const file of fs.readdirSync(publishedDir).filter((entry) => entry.endsWith('.json'))) {
    const article = JSON.parse(fs.readFileSync(path.join(publishedDir, file), 'utf-8')) as {
      slug?: unknown;
      title?: unknown;
      category?: unknown;
      metadata?: {
        contentType?: unknown;
        components?: unknown[];
        topics?: unknown[];
      };
    };
    const haystack = [
      article.slug,
      article.title,
      article.category,
      article.metadata?.contentType,
      ...(article.metadata?.components || []),
      ...(article.metadata?.topics || []),
    ].filter((value): value is string => typeof value === 'string').join(' ').toLowerCase();

    if (/build|frame|motor|esc|flight controller|component|wiring|solder|battery|lipo|vtx|camera|radio|goggle|elrs|propeller|hardware|setup/.test(haystack)) {
      build++;
    }
    if (/pid|blackbox|betaflight|tuning|filter|oscillation|gyro|propwash|rates|troubleshooting|no-video/.test(haystack)) {
      tuning++;
    }
  }

  return { build, tuning, total: build + tuning };
}

function row(tool: string, status: AuditStatus, dataSource: string, finding: string, nextAction: string): AuditRow {
  return { tool, status, dataSource, finding, nextAction };
}

const products = getFpvProductCatalog();
const sourcePackPath = path.join(process.cwd(), 'data', 'fpv-product-source-pack.json');
const productSourceCount = fs.existsSync(sourcePackPath)
  ? (JSON.parse(fs.readFileSync(sourcePackPath, 'utf-8')) as { sources?: unknown[] }).sources?.length ?? 0
  : 0;
const realImageCount = products.filter((product) => product.imageUrl).length;
const counts = typeCount(products);
const localToolCorpus = localPublishedToolCorpus();
const blackboxSourcePackPath = path.join(process.cwd(), 'data', 'fpv-rag-source-pack.blackbox.json');
const blackboxSourceCount = fs.existsSync(blackboxSourcePackPath)
  ? (JSON.parse(fs.readFileSync(blackboxSourcePackPath, 'utf-8')) as { sources?: unknown[] }).sources?.length ?? 0
  : 0;
const blackboxSourceUrls = fs.existsSync(blackboxSourcePackPath)
  ? ((JSON.parse(fs.readFileSync(blackboxSourcePackPath, 'utf-8')) as { sources?: { url?: unknown }[] }).sources ?? [])
    .map((source) => source.url)
    .filter((url): url is string => typeof url === 'string')
  : [];
const crawlQueuePath = path.join(process.cwd(), 'data', 'crawl-queue.json');
const crawlQueueJobs = fs.existsSync(crawlQueuePath)
  ? (JSON.parse(fs.readFileSync(crawlQueuePath, 'utf-8')) as { jobs?: { url?: unknown; status?: unknown }[] }).jobs ?? []
  : [];
const blackboxQueuedCount = crawlQueueJobs.filter((job) =>
  typeof job.url === 'string'
  && blackboxSourceUrls.includes(job.url)
  && ['pending', 'processing', 'throttled'].includes(String(job.status))
).length;
const blackboxCrawledCount = crawlQueueJobs.filter((job) =>
  typeof job.url === 'string'
  && blackboxSourceUrls.includes(job.url)
  && job.status === 'completed'
).length;
const blackboxUiPath = path.join(process.cwd(), 'src', 'features', 'tools', 'components', 'BlackboxTuner.tsx');
const blackboxUiSource = fs.existsSync(blackboxUiPath) ? fs.readFileSync(blackboxUiPath, 'utf-8') : '';
const blackboxAcceptMatch = blackboxUiSource.match(/accept="([^"]+)"/);
const blackboxAccepts = blackboxAcceptMatch?.[1] ?? '';
const blackboxBinaryPromiseAligned = !blackboxAccepts.includes('.bbl') && !blackboxAccepts.includes('.bfl');
const blackboxSmokeExists = fs.existsSync(path.join(process.cwd(), 'scripts', 'blackbox-smoke.ts'));
const catalogCoverage = Object.entries(counts)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([type, count]) => `${type}:${count}`)
  .join(', ');

const productCatalogFinding = `${products.length} products, ${realImageCount} real images, coverage ${catalogCoverage || 'none'}`;
const imageCoveragePct = products.length > 0 ? Math.round((realImageCount / products.length) * 100) : 0;
const crawlerBackedCount = products.filter((product) => product.provenance?.source === 'crawler').length;
const localCatalogReady = products.length >= 100
  && imageCoveragePct >= 90
  && Object.values(counts).filter((count) => count >= 2).length >= 8;
const buildLocalReady = localToolCorpus.build >= 30;
const tuningLocalReady = localToolCorpus.tuning >= 10;

const rows: AuditRow[] = [
  row(
    'Build Calculator',
    'PASS',
    'deterministic local formula',
    'AUW/thrust/flight-time math is local and does not depend on crawler freshness.',
    'Keep formulas covered by typecheck and add unit tests when tuning formulas change.',
  ),
  row(
    'Build Wizard',
    hasDifyApp('Build Wizard') && buildLocalReady ? 'PASS' : 'PARTIAL',
    'deterministic calculator + local source-backed corpus + optional Dify workflow',
    `Workflow configured: ${hasDifyApp('Build Wizard')}; local build/component articles=${localToolCorpus.build}. Qdrant live counts not checked locally — verify via SSH or Dify Studio.`,
    buildLocalReady
      ? 'Keep public copy clear that local calculator/corpus is production-ready while Dify corpus depth is still tracked separately.'
      : 'Add more local build/component guides or refresh fpv-build-guides + fpv-components-specs with source-backed docs.',
  ),
  row(
    'Part Matcher',
    localCatalogReady ? 'PASS' : 'PARTIAL',
    'shared local catalog + guided compatibility workflow',
    `${productCatalogFinding}; image coverage=${imageCoveragePct}%; crawler-backed=${crawlerBackedCount}. Qdrant live counts not checked locally — verify via SSH or Dify Studio.`,
    localCatalogReady
      ? 'Local deterministic compatibility is production-ready; continue expanding crawler-backed provenance before claiming full RAG grounding.'
      : 'Expand catalog coverage, image coverage, and crawler-backed source provenance.',
  ),
  row(
    'Component Duel',
    localCatalogReady ? 'PASS' : 'PARTIAL',
    'shared local catalog',
    `${productCatalogFinding}; image coverage=${imageCoveragePct}%; crawler-backed=${crawlerBackedCount}.`,
    localCatalogReady
      ? 'Local comparison engine has enough same-type alternatives; keep exact variant verification in the UI.'
      : 'Use the same expanded catalog as Part Matcher so comparisons have enough same-type alternatives.',
  ),
  row(
    'Hardware Analyzer',
    hasDifyApp('Part Matcher') && localCatalogReady ? 'PASS' : 'PARTIAL',
    'catalog-assisted local matching + deterministic compatibility + optional Dify workflow',
    `Compatibility workflow configured: ${hasDifyApp('Part Matcher')}; local catalog ready=${localCatalogReady}; products=${products.length}; image coverage=${imageCoveragePct}%.`,
    localCatalogReady
      ? 'Keep exact-match guidance visible so users know catalog-backed scoring improves with precise product names.'
      : 'Expand catalog coverage and source provenance before marking hardware analysis complete.',
  ),
  row(
    'Blackbox Tuning',
    hasDifyApp('Blackbox Tuning Advisor') && blackboxBinaryPromiseAligned && blackboxSmokeExists
      ? 'PARTIAL'
      : 'PARTIAL',
    'local tuning guardrail + optional Dify grounding',
    `Workflow configured: ${hasDifyApp('Blackbox Tuning Advisor')}; local tuning articles=${localToolCorpus.tuning}; source backlog=${blackboxSourceCount}; queued=${blackboxQueuedCount}; crawled=${blackboxCrawledCount}; binary promise aligned=${blackboxBinaryPromiseAligned}; smoke=${blackboxSmokeExists}. WARN: fpv-flight-tuning Qdrant collection known to contain GitHub UI contamination — clean crawl required before claiming full grounding. Verify live Qdrant counts via SSH; do not rely on stale local docCount.`,
    hasDifyApp('Blackbox Tuning Advisor')
      ? 'Clean fpv-flight-tuning dataset (GitHub UI contamination), add smoke test, verify Qdrant counts live before upgrading to PASS.'
      : 'Configure DIFY_APP_TOKEN_BLACKBOX and clean the contaminated fpv-flight-tuning Qdrant collection.',
  ),
  row(
    'Flight Critic',
    'DEFERRED',
    'disabled UI / future video workflow',
    'Intentionally postponed; current page should not be marketed as real frame-level video analysis.',
    'Create a dedicated video/telemetry workflow after catalog-backed product tools are live.',
  ),
];

console.log('\nFPVLovers Tool Truth Audit\n');
console.table(rows);
console.log(`Catalog summary: ${productCatalogFinding}`);
console.log(`Local tool corpus: build/component=${localToolCorpus.build}, tuning/troubleshooting=${localToolCorpus.tuning}`);
console.log(`Product source pack: ${productSourceCount} crawler source(s) ready for catalog expansion`);
console.log(`NOTE: Qdrant live counts are NOT checked here — verify via SSH or Dify Studio. The stale docCount field was removed from DATASETS.`);
console.log(`Blackbox source pack: ${blackboxSourceCount} source(s); queued=${blackboxQueuedCount}; crawled=${blackboxCrawledCount}; binary upload promise aligned=${blackboxBinaryPromiseAligned}; smoke script=${blackboxSmokeExists}`);

const strictFailures = rows.filter((auditRow) => auditRow.status === 'FAIL');
if (strict && strictFailures.length > 0) {
  console.error(`\nStrict audit failed: ${strictFailures.map((auditRow) => auditRow.tool).join(', ')}`);
  process.exit(1);
}
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Tool truth audit failed.';
  console.error(message);
  process.exit(1);
});

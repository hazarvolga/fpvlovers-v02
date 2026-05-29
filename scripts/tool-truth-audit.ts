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

function datasetDocCount(name: string): number {
  return datasets.find((dataset) => dataset.name === name)?.docCount ?? 0;
}

function hasDifyApp(name: string): boolean {
  return Boolean(difyApps.find((app) => app.name === name)?.token);
}

function typeCount(products: FpvCatalogProduct[]): Record<string, number> {
  return products.reduce<Record<string, number>>((counts, product) => {
    counts[product.type] = (counts[product.type] ?? 0) + 1;
    return counts;
  }, {});
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
const componentsDocs = datasetDocCount('fpv-components-specs');
const buildDocs = datasetDocCount('fpv-build-guides');
const tuningDocs = datasetDocCount('fpv-flight-tuning') + datasetDocCount('fpv-pid-profiles');
const catalogCoverage = Object.entries(counts)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([type, count]) => `${type}:${count}`)
  .join(', ');

const productCatalogFinding = `${products.length} products, ${realImageCount} real images, coverage ${catalogCoverage || 'none'}`;
const catalogIsMvpOnly = products.length < 50 || realImageCount === 0 || componentsDocs < 10;

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
    hasDifyApp('Build Wizard') ? 'PARTIAL' : 'FAIL',
    'local calculator + guided build workflow',
    `Workflow configured: ${hasDifyApp('Build Wizard')}; routing doc counts build=${buildDocs}, components=${componentsDocs}.`,
    'Run production workflow smoke and refresh fpv-build-guides + fpv-components-specs with source-backed docs.',
  ),
  row(
    'Part Matcher',
    catalogIsMvpOnly ? 'PARTIAL' : 'PASS',
    'shared local catalog + guided compatibility workflow',
    productCatalogFinding,
    'Replace placeholder affiliate seed data with crawler-backed product specs, real images, and source provenance.',
  ),
  row(
    'Component Duel',
    catalogIsMvpOnly ? 'PARTIAL' : 'PASS',
    'shared local catalog',
    productCatalogFinding,
    'Use the same expanded catalog as Part Matcher so comparisons have enough same-type alternatives.',
  ),
  row(
    'Hardware Analyzer',
    hasDifyApp('Part Matcher') && !catalogIsMvpOnly ? 'PASS' : 'PARTIAL',
    'manual input + guided compatibility workflow',
    `Compatibility workflow configured: ${hasDifyApp('Part Matcher')}; catalog is ${catalogIsMvpOnly ? 'MVP-only' : 'broad enough'}.`,
    'Point analyzer at normalized catalog entities instead of free-text-only hardware fields.',
  ),
  row(
    'Blackbox Tuning',
    hasDifyApp('Blackbox Tuning Advisor') && tuningDocs > 0 ? 'PASS' : 'PARTIAL',
    'local tuning guardrail + guided blackbox workflow',
    `Blackbox workflow configured: ${hasDifyApp('Blackbox Tuning Advisor')}; routing tuning docs=${tuningDocs}.`,
    'Keep provider credential smoke in the release gate and expand PID/troubleshooting corpora.',
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
console.log(`Product source pack: ${productSourceCount} crawler source(s) ready for catalog expansion`);
console.log(`Dataset routing doc counts: components=${componentsDocs}, build=${buildDocs}, tuning=${tuningDocs}`);

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

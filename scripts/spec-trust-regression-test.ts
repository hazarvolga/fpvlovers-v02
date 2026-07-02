import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { discoverMigrationFiles } from '../src/lib/server/migrations';
import {
  createUnknownSpec,
  createVerifiedSpec,
  evidenceBoundSpecSchema,
  evidenceSpecStatusSchema,
  isEvidenceBoundSpec,
  productTrustStatusSchema,
} from '../src/lib/types/spec-trust';
import {
  getLegacySpecs,
  getSpecNumber,
  getSpecString,
  getSpecTrustBadge,
  getSpecValue,
} from '../src/lib/tools/spec-trust-legacy';
import type { FpvCatalogProduct } from '../src/lib/tools/fpv-product-types';
import { extractProductsFromMarkdown } from '../src/lib/tools/product-catalog-extractor';
import { normalizeCrawlerCatalog } from '../src/lib/tools/crawler-product-catalog';
import {
  mergeCrawlerProductCatalog,
  mergeCatalogProduct,
  prepareCatalogProductForIngestion,
  upsertCatalogProductsToDb,
  type ProductCatalogDbClient,
} from '../src/lib/tools/product-catalog-ingestion';

const sourceUrl = 'https://manufacturer.example/products/motor-2207';

function product(overrides: Partial<FpvCatalogProduct> = {}): FpvCatalogProduct {
  return {
    id: 'motor-1', name: 'Motor 2207', brand: 'Example', type: 'motor', category: 'Motors',
    sourceNetwork: 'manufacturer', url: sourceUrl, price: 24.99, currency: 'USD', trustScore: 0.8,
    keywords: [], compatibleWith: [], tags: [],
    specs: { kv: 1750, protocols: ['dshot600'], enabled: true },
    fit: { styles: ['freestyle'] }, ...overrides,
  };
}

for (const status of ['QUARANTINE', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED']) {
  assert.equal(productTrustStatusSchema.parse(status), status);
}
assert.equal(productTrustStatusSchema.safeParse('PUBLISHED').success, false);
for (const status of ['unverified', 'conflicting', 'verified', 'rejected']) {
  assert.equal(evidenceSpecStatusSchema.parse(status), status);
}

const verifiedKv = createVerifiedSpec({ value: 1950, unit: 'KV', sourceUrls: [sourceUrl], sourceType: 'manufacturer', confidence: 0.98, extractionMethod: 'spec_table' });
assert.equal(evidenceBoundSpecSchema.parse(verifiedKv).status, 'verified');
const unknownKv = createUnknownSpec({ unit: 'KV', sourceUrls: [sourceUrl], sourceType: 'unknown', confidence: 0, extractionMethod: 'regex' });
assert.equal(unknownKv.value, null);
assert.equal(unknownKv.status, 'unverified');

const evidenceProduct = product({ evidenceSpecs: { kv: verifiedKv } });
assert.equal(getSpecValue(evidenceProduct, 'kv'), 1950);
assert.equal(getSpecNumber(evidenceProduct, 'kv'), 1950);
assert.equal(getSpecString(evidenceProduct, 'kv'), undefined);
const suppressedProduct = product({ evidenceSpecs: { kv: unknownKv } });
assert.equal(getSpecValue(suppressedProduct, 'kv'), null);
assert.equal(getSpecNumber(suppressedProduct, 'kv'), undefined);
assert.equal(getSpecValue(suppressedProduct, 'missing'), undefined);
assert.equal(isEvidenceBoundSpec(suppressedProduct.specs.kv), false);

const serialized = getLegacySpecs(evidenceProduct);
assert.deepEqual(serialized, { kv: 1950, protocols: ['dshot600'], enabled: true });
assert.equal('sourceUrls' in serialized, false);
assert.equal(getSpecTrustBadge(evidenceProduct, 'kv'), 'VERIFIED');
assert.equal(getSpecTrustBadge(suppressedProduct, 'kv'), 'UNVERIFIED');

assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, confidence: 1.01 }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, status: 'trusted' }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, sourceUrls: [] }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, sourceUrls: ['not-a-url'] }).success, false);
for (const unsafeUrl of [
  'ftp://manufacturer.example/specs',
  'file:///etc/passwd',
  'javascript:alert(1)',
]) {
  assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, sourceUrls: [unsafeUrl] }).success, false);
}
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: { nested: true } }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: Number.NaN }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: Number.POSITIVE_INFINITY }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: [] }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: ['dshot600', 600] }).success, false);
assert.equal(evidenceBoundSpecSchema.safeParse({ ...verifiedKv, value: null }).success, false);
assert.throws(() => createVerifiedSpec({ ...verifiedKv, value: null }));
assert.throws(() => createVerifiedSpec({ ...verifiedKv, value: [] }));

const malformedEvidenceProduct = product({
  specs: {
    nan: 100,
    infinity: 200,
    empty: ['primitive-fallback'],
    mixed: 'primitive-fallback',
  },
  evidenceSpecs: {
    nan: { ...verifiedKv, value: Number.NaN },
    infinity: { ...verifiedKv, value: Number.POSITIVE_INFINITY },
    empty: { ...verifiedKv, value: [] },
    mixed: { ...verifiedKv, value: ['dshot600', 600] },
  } as unknown as FpvCatalogProduct['evidenceSpecs'],
});
assert.deepEqual(getLegacySpecs(malformedEvidenceProduct), {});

const malformedStatusProduct = product({
  specs: { label: 'primitive-fallback' },
  evidenceSpecs: {
    label: { ...verifiedKv, value: 'evidence', status: 42 },
  } as unknown as FpvCatalogProduct['evidenceSpecs'],
});
assert.equal(getSpecValue(malformedStatusProduct, 'label'), undefined);
assert.equal(getSpecNumber(malformedStatusProduct, 'label'), undefined);
assert.equal(getSpecString(malformedStatusProduct, 'label'), undefined);
assert.equal(getSpecTrustBadge(malformedStatusProduct, 'label'), undefined);
assert.deepEqual(getLegacySpecs(malformedStatusProduct), {});

const malformedNumberProduct = product({
  specs: { kv: 1750 },
  evidenceSpecs: {
    kv: { ...verifiedKv, value: Number.POSITIVE_INFINITY },
  } as unknown as FpvCatalogProduct['evidenceSpecs'],
});
assert.equal(getSpecValue(malformedNumberProduct, 'kv'), undefined);
assert.equal(getSpecNumber(malformedNumberProduct, 'kv'), undefined);
assert.equal(getSpecString(malformedNumberProduct, 'kv'), undefined);
assert.equal(getSpecTrustBadge(malformedNumberProduct, 'kv'), undefined);
assert.deepEqual(getLegacySpecs(malformedNumberProduct), {});

const migrationSql = readFileSync(
  new URL('../db/migrations/0008_spec_trust_layer.sql', import.meta.url),
  'utf8',
);
const normalizedMigrationSql = migrationSql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();

assert.match(normalizedMigrationSql, /SET\s+LOCAL\s+lock_timeout\s*=\s*'5s'/i);

for (const [column, definition] of [
  ['trust_status', String.raw`TEXT\s+NOT\s+NULL\s+DEFAULT\s+'QUARANTINE'`],
  ['conflict_log', String.raw`JSONB\s+NOT\s+NULL\s+DEFAULT\s+'\[\]'::JSONB`],
  ['max_cell_count', String.raw`INTEGER`],
  ['mounting_pattern', String.raw`TEXT`],
  ['motor_kv', String.raw`INTEGER`],
  ['esc_continuous_amp', String.raw`INTEGER`],
  ['prop_diameter', String.raw`NUMERIC\s*\(\s*4\s*,\s*2\s*\)`],
  ['connector', String.raw`TEXT`],
] as const) {
  assert.match(
    normalizedMigrationSql,
    new RegExp(String.raw`ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+${column}\s+${definition}`, 'i'),
    `migration must add ${column} idempotently`,
  );
}

assert.match(
  normalizedMigrationSql,
  /DO\s+\$\$[\s\S]*pg_constraint[\s\S]*conrelid\s*=\s*'fpvlovers_commerce\.products'::regclass[\s\S]*ADD\s+CONSTRAINT\s+products_trust_status_check[\s\S]*CHECK/i,
);
assert.match(
  normalizedMigrationSql,
  /CHECK\s*\(\s*trust_status\s+IN\s*\(\s*'QUARANTINE'\s*,\s*'REVIEW_REQUIRED'\s*,\s*'VERIFIED'\s*,\s*'REJECTED'\s*\)\s*\)/i,
);
const notValidOffset = normalizedMigrationSql.search(/NOT\s+VALID/i);
const validateOffset = normalizedMigrationSql.search(
  /VALIDATE\s+CONSTRAINT\s+products_trust_status_check/i,
);
assert.ok(notValidOffset >= 0 && validateOffset > notValidOffset);

assert.match(normalizedMigrationSql, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_commerce_products_trust_status\s+ON\s+fpvlovers_commerce\.products\s*\(\s*trust_status\s*\)/i);
assert.match(normalizedMigrationSql, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_commerce_products_category_trust_status\s+ON\s+fpvlovers_commerce\.products\s*\(\s*category\s*,\s*trust_status\s*\)/i);
for (const [indexName, column] of [
  ['idx_commerce_products_motor_kv', 'motor_kv'],
  ['idx_commerce_products_esc_continuous_amp', 'esc_continuous_amp'],
  ['idx_commerce_products_max_cell_count', 'max_cell_count'],
  ['idx_commerce_products_mounting_pattern', 'mounting_pattern'],
] as const) {
  assert.match(
    normalizedMigrationSql,
    new RegExp(String.raw`CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+${indexName}\s+ON\s+fpvlovers_commerce\.products\s*\(\s*${column}\s*\)\s+WHERE\s+${column}\s+IS\s+NOT\s+NULL`, 'i'),
    `migration must create a partial ${column} index`,
  );
}

assert.doesNotMatch(normalizedMigrationSql, /\b(?:DROP|TRUNCATE|DELETE)\b/i);
assert.doesNotMatch(normalizedMigrationSql, /\b(?:UPDATE|INSERT|DELETE|MERGE|COPY)\b/i);
assert.doesNotMatch(normalizedMigrationSql, /\bALTER\s+TABLE\s+[^;]*\b(?:RENAME|ALTER\s+COLUMN)\b/i);
for (const alterTableStatement of normalizedMigrationSql.match(/ALTER\s+TABLE\s+[^;]+/gi) ?? []) {
  assert.match(
    alterTableStatement,
    /\b(?:ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS|ADD\s+CONSTRAINT|VALIDATE\s+CONSTRAINT)\b/i,
  );
}

const migrationsDir = fileURLToPath(new URL('../db/migrations', import.meta.url));
const discoveredMigrations = discoverMigrationFiles(migrationsDir);
const migrationVersions = discoveredMigrations.map((migration) => migration.version);
assert.ok(migrationVersions.includes('0008'));
assert.ok(migrationVersions.indexOf('0008') > migrationVersions.indexOf('0007'));
assert.equal(discoveredMigrations.find((migration) => migration.version === '0008')?.name, 'spec_trust_layer');

function extract(markdown: string, url = 'https://www.getfpv.com/motors.html') {
  return extractProductsFromMarkdown({ url, markdown, crawledAt: '2026-06-29T10:00:00.000Z' });
}

const explicitKv = extract('- [Example 2207 Motor](https://shop.example/motor)\n  - Motor KV: 1850KV');
assert.equal(explicitKv.products.length, 1);
assert.equal(explicitKv.products[0]?.specs.kv, 1850);
assert.deepEqual(explicitKv.products[0]?.evidenceSpecs?.kv, {
  value: 1850,
  unit: 'KV',
  sourceUrls: ['https://www.getfpv.com/motors.html'],
  sourceType: 'retailer',
  confidence: 0.82,
  extractionMethod: 'regex',
  status: 'unverified',
  observedAt: '2026-06-29T10:00:00.000Z',
  rawValue: '1850KV',
});
assert.equal(explicitKv.products[0]?.trustStatus, 'QUARANTINE');

const manufacturer = extract(
  '- [DJI O4 Air Unit](https://store.dji.com/product/o4-air-unit)\n  - Weight: 8.2 g',
  'https://www.dji.com/o4-air-unit/specs',
);
assert.equal(manufacturer.products[0]?.evidenceSpecs?.weight.sourceType, 'manufacturer');
assert.equal(manufacturer.products[0]?.evidenceSpecs?.weight.status, 'unverified');
assert.equal(manufacturer.products[0]?.trustStatus, 'QUARANTINE');
assert.equal(manufacturer.products[0]?.fit.protocols, undefined);

const noCellInference = extract('- [Example 2207 1850KV Motor](https://shop.example/motor)\n  - Stator: 2207');
assert.equal(noCellInference.products[0]?.specs.cellCount, undefined);
assert.equal(noCellInference.products[0]?.evidenceSpecs?.cellCount, undefined);
assert.equal(noCellInference.products[0]?.evidenceSpecs?.kv, undefined);
assert.equal(noCellInference.products[0]?.fit.cellCounts, undefined);
assert.equal(noCellInference.products[0]?.fit.propSizes, undefined);

for (const [label, statement, reason] of [
  ['ESC', 'Continuous current: 999A', 'escAmp_out_of_range:999A'],
  ['motor', 'Motor KV: 99999KV', 'kv_out_of_range:99999KV'],
  ['battery', 'Cell count: 0S', 'cellCount_out_of_range:0S'],
  ['battery', 'Cell count: 9S', 'cellCount_out_of_range:9S'],
  ['prop', 'Prop diameter: 25 inch', 'propSize_out_of_range:25 inch'],
  ['frame', 'Weight: 9999 g', 'weight_out_of_range:9999 g'],
  ['stack', 'Mounting: 99x99 mm', 'mount_out_of_range:99x99 mm'],
] as const) {
  const result = extract(`- [Example ${label} Product](https://shop.example/${label})\n  - ${statement}`);
  assert.equal(result.products.length, 0, statement);
  assert.equal(result.rejected[0]?.reason, reason);
}

const lookalike = extract(
  '- [DJI O4 Air Unit](https://evil-dji.com/o4)\n  - Weight: 8.2 g',
  'https://evil-dji.com/specs.pdf',
);
assert.equal(lookalike.products[0]?.evidenceSpecs?.weight.sourceType, 'unknown');
assert.doesNotThrow(() => extractProductsFromMarkdown({ url: 'not a url', markdown: '- [Motor](https://shop.example/m)\n  - Motor KV: 1850KV' }));

const isolatedCards = extract([
  '- [Alpha 2207 Motor](https://shop.example/alpha)',
  '  - Motor KV: 1850KV',
  '- [Beta 2207 Motor](https://shop.example/beta)',
  '  - Weight: 32 g',
].join('\n'));
assert.equal(isolatedCards.products.find((item) => item.name.includes('Alpha'))?.specs.weight, undefined);
assert.equal(isolatedCards.products.find((item) => item.name.includes('Beta'))?.specs.kv, undefined);

const persisted = normalizeCrawlerCatalog({ products: [{
  ...product(),
  trustStatus: 'VERIFIED',
  evidenceSpecs: { kv: verifiedKv },
}, {
  ...product({ id: 'bad-evidence' }),
  trustStatus: 'VERIFIED',
  evidenceSpecs: { kv: { ...verifiedKv, sourceUrls: ['javascript:alert(1)'] } },
}, {
  ...product({ id: 'bad-status' }),
  trustStatus: 'NOT_A_STATUS',
}, {
  ...product({ id: 'missing-evidence' }),
  trustStatus: 'VERIFIED',
}, {
  ...product({ id: 'empty-evidence' }),
  trustStatus: 'VERIFIED',
  evidenceSpecs: {},
}, {
  ...product({ id: 'unverified-only' }),
  trustStatus: 'VERIFIED',
  evidenceSpecs: { kv: unknownKv },
}] });
assert.equal(persisted[0]?.trustStatus, 'VERIFIED');
assert.equal(persisted[0]?.evidenceSpecs?.kv.status, 'verified');
assert.equal(persisted[1]?.trustStatus, 'QUARANTINE');
assert.deepEqual(persisted[1]?.evidenceSpecs, {});
assert.equal(persisted[2]?.trustStatus, 'QUARANTINE');
assert.equal(persisted[3]?.trustStatus, 'QUARANTINE');
assert.equal(persisted[4]?.trustStatus, 'QUARANTINE');
assert.equal(persisted[5]?.trustStatus, 'QUARANTINE');
assert.deepEqual(normalizeCrawlerCatalog('{ malformed json'), []);

const ingestedNew = mergeCrawlerProductCatalog([], [{
  ...product({ url: 'https://shop.example/new-motor', id: 'new-motor' }),
  trustStatus: 'VERIFIED',
  evidenceSpecs: { kv: verifiedKv },
}], '2026-06-29T11:00:00.000Z');
assert.equal(ingestedNew.stats.accepted, 1);
assert.equal(ingestedNew.products[0]?.trustStatus, 'QUARANTINE');

const verifiedWithoutEvidence = prepareCatalogProductForIngestion(product({ trustStatus: 'VERIFIED' }));
assert.equal(verifiedWithoutEvidence.trustStatus, 'QUARANTINE');

const incomingConflictKv = evidenceBoundSpecSchema.parse({
  value: 2200,
  unit: 'KV',
  sourceUrls: ['https://retailer.example/motor-2207'],
  sourceType: 'retailer',
  confidence: 0.72,
  extractionMethod: 'regex',
  status: 'unverified',
});
const incomingSameKvUnverified = evidenceBoundSpecSchema.parse({
  value: 1950,
  unit: 'KV',
  sourceUrls: ['https://retailer.example/motor-2207'],
  sourceType: 'retailer',
  confidence: 0.72,
  extractionMethod: 'regex',
  status: 'unverified',
});

const conflictMerge = mergeCatalogProduct(
  product({
    evidenceSpecs: { kv: verifiedKv },
    trustStatus: 'VERIFIED',
    specs: { kv: 1950 },
  }),
  product({
    evidenceSpecs: { kv: incomingConflictKv },
    trustStatus: 'QUARANTINE',
    specs: { kv: 2200 },
    url: sourceUrl,
  }),
  '2026-06-29T11:05:00.000Z',
);
assert.equal(conflictMerge.conflicts, 1);
assert.equal(conflictMerge.product.trustStatus, 'REVIEW_REQUIRED');
assert.equal(conflictMerge.product.evidenceSpecs?.kv.status, 'conflicting');
assert.equal(conflictMerge.product.conflictLog?.[0]?.field, 'kv');
assert.equal(conflictMerge.product.conflictLog?.[0]?.existingValue, 1950);
assert.equal(conflictMerge.product.conflictLog?.[0]?.incomingValue, 2200);

const identicalCriticalMerge = mergeCatalogProduct(
  product({ evidenceSpecs: { kv: verifiedKv }, trustStatus: 'VERIFIED', specs: { kv: 1950 } }),
  product({ evidenceSpecs: { kv: incomingSameKvUnverified }, trustStatus: 'QUARANTINE', specs: { kv: 1950 } }),
  '2026-06-29T11:06:00.000Z',
);
assert.equal(identicalCriticalMerge.conflicts, 0);
assert.equal(identicalCriticalMerge.product.conflictLog?.length, 0);
assert.equal(identicalCriticalMerge.product.trustStatus, 'VERIFIED');
assert.equal(identicalCriticalMerge.product.evidenceSpecs?.kv.status, 'verified');

const crossUrlConflictMerge = mergeCrawlerProductCatalog([
  product({
    brand: 'Example',
    name: 'Example 2207 Motor',
    url: 'https://manufacturer.example/motor-2207',
    evidenceSpecs: { kv: verifiedKv },
    trustStatus: 'VERIFIED',
    specs: { kv: 1950 },
  }),
], [
  product({
    brand: 'Example',
    name: 'Example 2207 Motor',
    url: 'https://retailer.example/motor-2207',
    evidenceSpecs: { kv: incomingConflictKv },
    trustStatus: 'QUARANTINE',
    specs: { kv: 2200 },
  }),
], '2026-06-29T11:06:30.000Z');
assert.equal(crossUrlConflictMerge.products.length, 1);
assert.equal(crossUrlConflictMerge.products[0]?.trustStatus, 'REVIEW_REQUIRED');
assert.equal(crossUrlConflictMerge.stats.conflicts, 1);

const existingColor = evidenceBoundSpecSchema.parse({
  value: 'black',
  unit: null,
  sourceUrls: [sourceUrl],
  sourceType: 'manufacturer',
  confidence: 0.9,
  extractionMethod: 'spec_table',
  status: 'verified',
});
const incomingColor = evidenceBoundSpecSchema.parse({
  value: 'orange',
  unit: null,
  sourceUrls: ['https://retailer.example/motor-2207'],
  sourceType: 'retailer',
  confidence: 0.7,
  extractionMethod: 'regex',
  status: 'unverified',
});
const noncriticalMerge = mergeCatalogProduct(
  product({ evidenceSpecs: { color: existingColor }, specs: { color: 'black' } }),
  product({ evidenceSpecs: { color: incomingColor }, specs: { color: 'orange' } }),
  '2026-06-29T11:07:00.000Z',
);
assert.equal(noncriticalMerge.conflicts, 0);
assert.equal(noncriticalMerge.product.evidenceSpecs?.color.value, 'black');

const malformedRawIngestion = mergeCrawlerProductCatalog([], [
  { not: 'a product' },
  {
    ...product({ id: 'malformed-evidence-ingestion', url: 'https://shop.example/malformed' }),
    evidenceSpecs: { kv: { ...verifiedKv, sourceUrls: ['javascript:alert(1)'] } },
    trustStatus: 'VERIFIED',
  },
]);
assert.equal(malformedRawIngestion.products.length, 1);
assert.equal(malformedRawIngestion.products[0]?.trustStatus, 'QUARANTINE');
assert.deepEqual(malformedRawIngestion.products[0]?.evidenceSpecs, {});

const fakeQueries: { text: string; params?: unknown[] }[] = [];
const fakeDbClient: ProductCatalogDbClient = {
  async query(text: string, params?: unknown[]) {
    fakeQueries.push({ text, params });
    return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
  },
};
const newDbVerifiedProduct = product({
  id: 'db-new-verified',
  url: 'https://shop.example/db-new-verified',
  trustStatus: 'VERIFIED',
  evidenceSpecs: { kv: verifiedKv },
  specs: { kv: 1950 },
});

const crawlerSource = readFileSync(new URL('../src/lib/tools/crawler-product-catalog.ts', import.meta.url), 'utf8');
assert.doesNotMatch(crawlerSource, /safeReadJson\s*<\s*any\s*>|\bas\s+any\b|:\s*any\b/);

void upsertCatalogProductsToDb(fakeDbClient, [conflictMerge.product])
  .then(() => upsertCatalogProductsToDb(fakeDbClient, [newDbVerifiedProduct]))
  .then(() => {
    assert.equal(fakeQueries.length, 2);
    assert.match(fakeQueries[0]?.text || '', /ON CONFLICT \(slug\) DO UPDATE/i);
    assert.equal(fakeQueries[0]?.params?.[6], 'REVIEW_REQUIRED');
    assert.match(String(fakeQueries[0]?.params?.[7]), /review_required/);
    assert.equal(fakeQueries[1]?.params?.[6], 'QUARANTINE');
    console.log('spec trust regression tests passed');
  })
  .catch((error: unknown) => {
    throw error;
  });

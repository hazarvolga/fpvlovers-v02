import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

assert.match(normalizedMigrationSql, /DO\s+\$\$[\s\S]*pg_constraint[\s\S]*ADD\s+CONSTRAINT[\s\S]*CHECK/i);
assert.match(
  normalizedMigrationSql,
  /CHECK\s*\(\s*trust_status\s+IN\s*\(\s*'QUARANTINE'\s*,\s*'REVIEW_REQUIRED'\s*,\s*'VERIFIED'\s*,\s*'REJECTED'\s*\)\s*\)/i,
);

assert.match(normalizedMigrationSql, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+\S+\s+ON\s+fpvlovers_commerce\.products\s*\(\s*trust_status\s*\)/i);
assert.match(normalizedMigrationSql, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+\S+\s+ON\s+fpvlovers_commerce\.products\s*\(\s*category\s*,\s*trust_status\s*\)/i);
for (const column of ['motor_kv', 'esc_continuous_amp', 'max_cell_count', 'mounting_pattern']) {
  assert.match(
    normalizedMigrationSql,
    new RegExp(String.raw`CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+\S+\s+ON\s+fpvlovers_commerce\.products\s*\(\s*${column}\s*\)\s+WHERE\s+${column}\s+IS\s+NOT\s+NULL`, 'i'),
    `migration must create a partial ${column} index`,
  );
}

assert.doesNotMatch(normalizedMigrationSql, /\b(?:DROP|TRUNCATE|DELETE)\b/i);
assert.doesNotMatch(normalizedMigrationSql, /\bALTER\s+TABLE\b[\s\S]*\bRENAME\b/i);
assert.doesNotMatch(normalizedMigrationSql, /\bUPDATE\s+fpvlovers_commerce\.products\b[\s\S]*\bVERIFIED\b/i);

console.log('spec trust regression tests passed');

import assert from 'node:assert/strict';
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

console.log('spec trust regression tests passed');

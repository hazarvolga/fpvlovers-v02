# Technical Spec Trust Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vertical-slice evidence-bound product specification trust layer so FPVLovers tools and commercial pages do not treat crawler or retailer specs as engineering-safe without verification.

**Architecture:** Add strict Zod schemas and legacy serializers first, then add SQL migration support, upgrade extraction to produce evidence-bound critical specs, add a quarantine/conflict ingestion service, and finally guard Part Matcher/Build Calculator/Hardware Analyzer outputs with explicit engineering-safety state. Existing UI compatibility is preserved through helper functions that expose legacy primitive values without fabricating missing critical specs.

**Tech Stack:** Next.js 15, TypeScript, Zod, PostgreSQL SQL migrations, `pg`, existing `tsx` regression scripts, existing catalog/tool modules.

---

## File Structure

- Create `src/lib/types/spec-trust.ts`: evidence-bound spec Zod schemas, trust enums, domain wrappers, helper type exports.
- Create `src/lib/tools/spec-trust-legacy.ts`: safe legacy getters/serializers for current UI and tool consumers.
- Create `db/migrations/0008_spec_trust_layer.sql`: additive catalog schema changes for trust status, conflict log, deterministic filter columns, and indexes.
- Create `scripts/spec-trust-regression-test.ts`: focused regression tests for schemas, serializers, extraction, conflict handling, and engineering-safe tool flags.
- Modify `src/lib/tools/fpv-product-types.ts`: add optional evidence-bound spec/trust fields without removing current primitive fields.
- Modify `src/lib/tools/product-catalog-extractor.ts`: produce evidence-bound critical specs and reject impossible values.
- Modify `src/lib/tools/crawler-product-catalog.ts`: normalize both legacy and evidence-bound specs safely.
- Create `src/lib/services/catalog-ingester.ts`: quarantine ingestion and conflict detection service.
- Modify `src/lib/tools/component-compatibility.ts`: expose `isEngineeringSafe` and warning fields while keeping existing checks.
- Modify `src/app/api/tools/part-matcher/route.ts`: attach engineering-safety state to responses.
- Modify `src/app/api/tools/hardware-analyzer/route.ts`: attach engineering-safety state to responses.
- Modify `package.json`: add `spec-trust:test` script.

## Task 1: Evidence-Bound Types and Legacy Serializers

**Files:**
- Create: `src/lib/types/spec-trust.ts`
- Create: `src/lib/tools/spec-trust-legacy.ts`
- Modify: `src/lib/tools/fpv-product-types.ts`
- Test: `scripts/spec-trust-regression-test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create the regression script skeleton**

Create `scripts/spec-trust-regression-test.ts` with this initial content:

```ts
import assert from 'node:assert/strict';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('spec trust regression harness is active', () => {
  assert.equal(true, true);
});
```

- [ ] **Step 2: Add the npm script**

Modify `package.json` scripts:

```json
"spec-trust:test": "node --import tsx scripts/spec-trust-regression-test.ts"
```

Run:

```bash
npm run spec-trust:test
```

Expected:

```text
✓ spec trust regression harness is active
```

- [ ] **Step 3: Write failing schema and serializer tests**

Replace `scripts/spec-trust-regression-test.ts` with:

```ts
import assert from 'node:assert/strict';
import {
  EvidenceBoundSpecSchema,
  ProductTrustStatusSchema,
  createUnknownSpec,
  createVerifiedSpec,
  isEvidenceBoundSpec,
} from '../src/lib/types/spec-trust';
import {
  getLegacySpecs,
  getSpecNumber,
  getSpecString,
  getSpecTrustBadge,
} from '../src/lib/tools/spec-trust-legacy';
import type { FpvCatalogProduct } from '../src/lib/tools/fpv-product-types';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const baseProduct: FpvCatalogProduct = {
  id: 'test-motor',
  name: 'Test Motor 2207 1850KV',
  brand: 'TestBrand',
  type: 'motor',
  category: 'motor',
  sourceNetwork: 'manual',
  url: 'https://example.com/motor',
  price: 29.99,
  currency: 'USD',
  trustScore: 80,
  keywords: ['motor'],
  compatibleWith: [],
  tags: ['motor'],
  specs: {
    kv: 1850,
    mount: '16x16',
  },
  fit: { styles: ['freestyle'] },
};

test('trust status enum accepts expected catalog states', () => {
  assert.equal(ProductTrustStatusSchema.parse('QUARANTINE'), 'QUARANTINE');
  assert.equal(ProductTrustStatusSchema.parse('VERIFIED'), 'VERIFIED');
});

test('evidence spec validates a verified KV field', () => {
  const parsed = EvidenceBoundSpecSchema.parse({
    value: 1850,
    unit: 'KV',
    sourceUrls: ['https://example.com/manual'],
    sourceType: 'manual',
    confidence: 0.98,
    extractionMethod: 'manual_override',
    status: 'verified',
  });
  assert.equal(parsed.value, 1850);
});

test('unknown spec never fabricates a missing critical value', () => {
  const spec = createUnknownSpec({
    unit: 'S',
    sourceUrl: 'https://example.com/retailer',
    sourceType: 'retailer',
    extractionMethod: 'regex',
    confidence: 0.4,
  });
  assert.equal(spec.value, null);
  assert.equal(spec.status, 'unverified');
});

test('legacy getters read evidence specs before primitive fallback', () => {
  const product: FpvCatalogProduct = {
    ...baseProduct,
    evidenceSpecs: {
      kv: createVerifiedSpec({
        value: 1960,
        unit: 'KV',
        sourceUrl: 'https://example.com/manual',
        sourceType: 'manual',
        extractionMethod: 'manual_override',
        confidence: 0.99,
      }),
      mountingPattern: createVerifiedSpec({
        value: '16x16',
        unit: 'mm',
        sourceUrl: 'https://example.com/manual',
        sourceType: 'manual',
        extractionMethod: 'manual_override',
        confidence: 0.99,
      }),
    },
  };

  assert.equal(getSpecNumber(product, 'kv'), 1960);
  assert.equal(getSpecString(product, 'mountingPattern'), '16x16');
  assert.equal(getLegacySpecs(product).kv, 1960);
  assert.equal(getSpecTrustBadge(product, 'kv'), 'verified');
});

test('legacy getters do not return unverified null critical values', () => {
  const product: FpvCatalogProduct = {
    ...baseProduct,
    specs: {},
    evidenceSpecs: {
      cellCount: createUnknownSpec({
        unit: 'S',
        sourceUrl: 'https://example.com/retailer',
        sourceType: 'retailer',
        extractionMethod: 'regex',
        confidence: 0.35,
      }),
    },
  };

  assert.equal(getSpecNumber(product, 'cellCount'), undefined);
  assert.equal(getSpecTrustBadge(product, 'cellCount'), 'unverified');
});

test('plain primitive specs are not mistaken for evidence specs', () => {
  assert.equal(isEvidenceBoundSpec(baseProduct.specs.kv), false);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
npm run spec-trust:test
```

Expected: FAIL because `src/lib/types/spec-trust.ts` and `src/lib/tools/spec-trust-legacy.ts` do not exist.

- [ ] **Step 5: Create `src/lib/types/spec-trust.ts`**

```ts
import { z } from 'zod';

export const ProductTrustStatusSchema = z.enum([
  'QUARANTINE',
  'REVIEW_REQUIRED',
  'VERIFIED',
  'REJECTED',
]);

export const SpecSourceTypeSchema = z.enum([
  'manufacturer',
  'retailer',
  'manual',
  'community',
]);

export const SpecExtractionMethodSchema = z.enum([
  'regex',
  'llm_extraction',
  'manual_override',
]);

export const SpecVerificationStatusSchema = z.enum([
  'verified',
  'conflicting',
  'unverified',
  'rejected',
]);

export const EvidenceBoundSpecSchema = z.object({
  value: z.union([z.number(), z.string(), z.array(z.string())]).nullable(),
  unit: z.string().nullable(),
  sourceUrls: z.array(z.string().url()).min(1),
  sourceType: SpecSourceTypeSchema,
  confidence: z.number().min(0).max(1),
  extractionMethod: SpecExtractionMethodSchema,
  status: SpecVerificationStatusSchema,
});

export type ProductTrustStatus = z.infer<typeof ProductTrustStatusSchema>;
export type SpecSourceType = z.infer<typeof SpecSourceTypeSchema>;
export type SpecExtractionMethod = z.infer<typeof SpecExtractionMethodSchema>;
export type SpecVerificationStatus = z.infer<typeof SpecVerificationStatusSchema>;
export type EvidenceBoundSpec = z.infer<typeof EvidenceBoundSpecSchema>;

export const EvidenceSpecRecordSchema = z.record(z.string(), EvidenceBoundSpecSchema);
export type EvidenceSpecRecord = z.infer<typeof EvidenceSpecRecordSchema>;

export const MotorEvidenceSpecsSchema = z.object({
  kv: EvidenceBoundSpecSchema.optional(),
  statorSize: EvidenceBoundSpecSchema.optional(),
  mountingPattern: EvidenceBoundSpecSchema.optional(),
  propSize: EvidenceBoundSpecSchema.optional(),
  weight: EvidenceBoundSpecSchema.optional(),
}).passthrough();

export const EscEvidenceSpecsSchema = z.object({
  continuousAmp: EvidenceBoundSpecSchema.optional(),
  burstAmp: EvidenceBoundSpecSchema.optional(),
  maxCellCount: EvidenceBoundSpecSchema.optional(),
  firmware: EvidenceBoundSpecSchema.optional(),
  mountingPattern: EvidenceBoundSpecSchema.optional(),
}).passthrough();

export const BatteryEvidenceSpecsSchema = z.object({
  cellCount: EvidenceBoundSpecSchema.optional(),
  capacityMah: EvidenceBoundSpecSchema.optional(),
  cRating: EvidenceBoundSpecSchema.optional(),
  connector: EvidenceBoundSpecSchema.optional(),
  weight: EvidenceBoundSpecSchema.optional(),
}).passthrough();

export function isEvidenceBoundSpec(value: unknown): value is EvidenceBoundSpec {
  return EvidenceBoundSpecSchema.safeParse(value).success;
}

export function createUnknownSpec(input: {
  unit: string | null;
  sourceUrl: string;
  sourceType: SpecSourceType;
  extractionMethod: SpecExtractionMethod;
  confidence: number;
}): EvidenceBoundSpec {
  return {
    value: null,
    unit: input.unit,
    sourceUrls: [input.sourceUrl],
    sourceType: input.sourceType,
    confidence: input.confidence,
    extractionMethod: input.extractionMethod,
    status: 'unverified',
  };
}

export function createVerifiedSpec(input: {
  value: number | string | string[];
  unit: string | null;
  sourceUrl: string;
  sourceType: SpecSourceType;
  extractionMethod: SpecExtractionMethod;
  confidence: number;
}): EvidenceBoundSpec {
  return {
    value: input.value,
    unit: input.unit,
    sourceUrls: [input.sourceUrl],
    sourceType: input.sourceType,
    confidence: input.confidence,
    extractionMethod: input.extractionMethod,
    status: 'verified',
  };
}
```

- [ ] **Step 6: Extend `src/lib/tools/fpv-product-types.ts`**

Add this import at the top:

```ts
import type { EvidenceSpecRecord, ProductTrustStatus } from '@/lib/types/spec-trust';
```

Add optional fields to `FpvCatalogProduct` after `trustScore`:

```ts
  trustStatus?: ProductTrustStatus;
  evidenceSpecs?: EvidenceSpecRecord;
  conflictLog?: Array<{
    field: string;
    existingValue: unknown;
    incomingValue: unknown;
    sourceUrls: string[];
    detectedAt: string;
  }>;
  isEngineeringSafe?: boolean;
  engineeringWarning?: string;
```

- [ ] **Step 7: Create `src/lib/tools/spec-trust-legacy.ts`**

```ts
import type { FpvCatalogProduct, ProductSpecValue } from '@/lib/tools/fpv-product-types';
import { isEvidenceBoundSpec, type EvidenceBoundSpec } from '@/lib/types/spec-trust';

function getEvidenceSpec(product: FpvCatalogProduct, key: string): EvidenceBoundSpec | undefined {
  const evidence = product.evidenceSpecs?.[key];
  return isEvidenceBoundSpec(evidence) ? evidence : undefined;
}

function primitiveSpec(product: FpvCatalogProduct, key: string): ProductSpecValue | undefined {
  return product.specs[key];
}

export function getSpecNumber(product: FpvCatalogProduct | undefined, key: string): number | undefined {
  if (!product) return undefined;
  const evidence = getEvidenceSpec(product, key);
  if (evidence) return typeof evidence.value === 'number' ? evidence.value : undefined;
  const primitive = primitiveSpec(product, key);
  return typeof primitive === 'number' && Number.isFinite(primitive) ? primitive : undefined;
}

export function getSpecString(product: FpvCatalogProduct | undefined, key: string): string | undefined {
  if (!product) return undefined;
  const evidence = getEvidenceSpec(product, key);
  if (evidence) return typeof evidence.value === 'string' ? evidence.value : undefined;
  const primitive = primitiveSpec(product, key);
  return typeof primitive === 'string' && primitive.trim().length > 0 ? primitive : undefined;
}

export function getSpecNumberArray(product: FpvCatalogProduct | undefined, key: string): number[] {
  if (!product) return [];
  const primitive = primitiveSpec(product, key);
  return Array.isArray(primitive) ? primitive.filter((item): item is number => typeof item === 'number') : [];
}

export function getSpecTrustBadge(product: FpvCatalogProduct | undefined, key: string): 'verified' | 'conflicting' | 'unverified' | 'rejected' | 'legacy' | 'missing' {
  if (!product) return 'missing';
  const evidence = getEvidenceSpec(product, key);
  if (evidence) return evidence.status;
  return primitiveSpec(product, key) === undefined ? 'missing' : 'legacy';
}

export function getLegacySpecs(product: FpvCatalogProduct): Record<string, ProductSpecValue> {
  const legacy: Record<string, ProductSpecValue> = { ...product.specs };
  for (const [key, evidence] of Object.entries(product.evidenceSpecs || {})) {
    if (!isEvidenceBoundSpec(evidence)) continue;
    if (evidence.value === null) continue;
    if (typeof evidence.value === 'number' || typeof evidence.value === 'string') {
      legacy[key] = evidence.value;
    }
  }
  return legacy;
}

export function hasVerifiedCriticalSpecs(product: FpvCatalogProduct | undefined, keys: string[]): boolean {
  if (!product) return false;
  return keys.every((key) => getSpecTrustBadge(product, key) === 'verified');
}
```

- [ ] **Step 8: Run tests and commit**

Run:

```bash
npm run spec-trust:test
npx tsc --noEmit
npm run lint:ci
```

Expected: all pass.

Commit:

```bash
git add package.json src/lib/types/spec-trust.ts src/lib/tools/spec-trust-legacy.ts src/lib/tools/fpv-product-types.ts scripts/spec-trust-regression-test.ts
git commit -m "feat: add evidence-bound spec types"
```

## Task 2: Additive Database Migration

**Files:**
- Create: `db/migrations/0008_spec_trust_layer.sql`
- Test: `scripts/spec-trust-regression-test.ts`

- [ ] **Step 1: Add migration text assertion to regression script**

Append to `scripts/spec-trust-regression-test.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';

test('spec trust migration is additive and defaults existing products to quarantine', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'db/migrations/0008_spec_trust_layer.sql'), 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS trust_status TEXT NOT NULL DEFAULT 'QUARANTINE'/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS conflict_log JSONB NOT NULL DEFAULT '\\[\\]'::JSONB/);
  assert.match(sql, /idx_commerce_products_trust_status/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run spec-trust:test
```

Expected: FAIL with missing `db/migrations/0008_spec_trust_layer.sql`.

- [ ] **Step 3: Create migration**

Create `db/migrations/0008_spec_trust_layer.sql`:

```sql
-- Add evidence-bound technical spec trust fields.
-- Existing catalog data remains available but is not automatically verified.

ALTER TABLE fpvlovers_commerce.products
  ADD COLUMN IF NOT EXISTS trust_status TEXT NOT NULL DEFAULT 'QUARANTINE',
  ADD COLUMN IF NOT EXISTS conflict_log JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS max_cell_count INTEGER,
  ADD COLUMN IF NOT EXISTS mounting_pattern TEXT,
  ADD COLUMN IF NOT EXISTS motor_kv INTEGER,
  ADD COLUMN IF NOT EXISTS esc_continuous_amp INTEGER,
  ADD COLUMN IF NOT EXISTS prop_diameter NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS connector TEXT;

ALTER TABLE fpvlovers_commerce.products
  ADD CONSTRAINT products_trust_status_check
  CHECK (trust_status IN ('QUARANTINE', 'REVIEW_REQUIRED', 'VERIFIED', 'REJECTED'));

CREATE INDEX IF NOT EXISTS idx_commerce_products_trust_status
  ON fpvlovers_commerce.products (trust_status);

CREATE INDEX IF NOT EXISTS idx_commerce_products_type_trust_status
  ON fpvlovers_commerce.products (category, trust_status);

CREATE INDEX IF NOT EXISTS idx_commerce_products_motor_kv
  ON fpvlovers_commerce.products (motor_kv)
  WHERE motor_kv IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commerce_products_esc_amp
  ON fpvlovers_commerce.products (esc_continuous_amp)
  WHERE esc_continuous_amp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commerce_products_max_cell_count
  ON fpvlovers_commerce.products (max_cell_count)
  WHERE max_cell_count IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commerce_products_mounting_pattern
  ON fpvlovers_commerce.products (mounting_pattern)
  WHERE mounting_pattern IS NOT NULL;
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npm run spec-trust:test
npm run lint:ci
```

Expected: all pass.

Commit:

```bash
git add db/migrations/0008_spec_trust_layer.sql scripts/spec-trust-regression-test.ts
git commit -m "feat: add spec trust database migration"
```

## Task 3: Evidence-Bound Extraction and Normalization

**Files:**
- Modify: `src/lib/tools/product-catalog-extractor.ts`
- Modify: `src/lib/tools/crawler-product-catalog.ts`
- Test: `scripts/spec-trust-regression-test.ts`

- [ ] **Step 1: Add failing extraction tests**

Append to `scripts/spec-trust-regression-test.ts`:

```ts
import { extractProductsFromMarkdown } from '../src/lib/tools/product-catalog-extractor';
import { getCrawlerProductCatalog } from '../src/lib/tools/crawler-product-catalog';

test('crawler extraction wraps explicit KV in evidence-bound specs', () => {
  const result = extractProductsFromMarkdown({
    url: 'https://example.com/products/test-motor',
    sourceName: 'Example Retailer',
    markdown: '[TestBrand 2207 Motor](https://example.com/products/test-motor)\\n1850KV motor for 5 inch freestyle.',
  });

  assert.equal(result.products.length, 1);
  const product = result.products[0];
  assert.equal(product.evidenceSpecs?.kv?.value, 1850);
  assert.equal(product.evidenceSpecs?.kv?.unit, 'KV');
  assert.equal(product.evidenceSpecs?.kv?.status, 'unverified');
  assert.equal(product.specs.kv, 1850);
});

test('crawler extraction does not infer missing battery cell count from product name alone', () => {
  const result = extractProductsFromMarkdown({
    url: 'https://example.com/products/test-stack',
    sourceName: 'Example Retailer',
    markdown: '[TestBrand F405 60A Stack](https://example.com/products/test-stack)\\nCompact FC and ESC stack for FPV builds.',
  });

  assert.equal(result.products.length, 1);
  const product = result.products[0];
  assert.equal(product.evidenceSpecs?.cellCount?.value, null);
  assert.equal(product.evidenceSpecs?.cellCount?.status, 'unverified');
});

test('crawler extraction rejects absurd ESC current values', () => {
  const result = extractProductsFromMarkdown({
    url: 'https://example.com/products/unsafe-esc',
    sourceName: 'Example Retailer',
    markdown: '[Unsafe 999A ESC](https://example.com/products/unsafe-esc)\\n999A ESC for small FPV quads.',
  });

  assert.equal(result.products.length, 0);
  assert.equal(result.rejected[0]?.reason, 'Rejected impossible ESC current rating.');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run spec-trust:test
```

Expected: FAIL because extractor does not yet populate `evidenceSpecs` or reject absurd ESC values.

- [ ] **Step 3: Add extraction helpers in `product-catalog-extractor.ts`**

Import:

```ts
import {
  createUnknownSpec,
  type EvidenceSpecRecord,
  type SpecSourceType,
} from '@/lib/types/spec-trust';
```

Add helpers near `parseSpecs`:

```ts
function sourceTypeForUrl(url: string): SpecSourceType {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('dji.com') || host.includes('radiomasterrc.com') || host.includes('betafpv.com') || host.includes('iflight-rc.com')) return 'manufacturer';
  if (host.includes('manual') || host.endsWith('.pdf')) return 'manual';
  return 'retailer';
}

function createExtractedSpec(input: {
  value: number | string;
  unit: string | null;
  sourceUrl: string;
  sourceType: SpecSourceType;
  confidence: number;
}) {
  return {
    value: input.value,
    unit: input.unit,
    sourceUrls: [input.sourceUrl],
    sourceType: input.sourceType,
    confidence: input.confidence,
    extractionMethod: 'regex' as const,
    status: input.sourceType === 'manufacturer' || input.sourceType === 'manual' ? 'verified' as const : 'unverified' as const,
  };
}

function parseEvidenceSpecs(text: string, sourceUrl: string): EvidenceSpecRecord {
  const sourceType = sourceTypeForUrl(sourceUrl);
  const specs: EvidenceSpecRecord = {};
  const kv = text.match(/\\b(\\d{3,5})\\s*kv\\b/i)?.[1];
  const amp = text.match(/\\b(\\d{2,3})\\s*a\\b/i)?.[1];
  const cell = text.match(/\\b([1-8])s\\b/i)?.[1];
  const prop = text.match(/\\b([1-9](?:\\.\\d)?)\\s*(?:inch|in|")\\b/i)?.[1];
  const weight = text.match(/\\b(\\d{1,4}(?:\\.\\d+)?)\\s*g\\b/i)?.[1];
  const mount = text.match(/\\b(20x20|25\\.5x25\\.5|30x30|16x16|12x12)\\b/i)?.[1];

  if (kv) specs.kv = createExtractedSpec({ value: Number(kv), unit: 'KV', sourceUrl, sourceType, confidence: 0.72 });
  if (amp) specs.escAmp = createExtractedSpec({ value: Number(amp), unit: 'A', sourceUrl, sourceType, confidence: 0.68 });
  if (cell) specs.cellCount = createExtractedSpec({ value: Number(cell), unit: 'S', sourceUrl, sourceType, confidence: 0.7 });
  if (prop) specs.propSize = createExtractedSpec({ value: Number(prop), unit: 'inch', sourceUrl, sourceType, confidence: 0.62 });
  if (weight) specs.weight = createExtractedSpec({ value: Number(weight), unit: 'g', sourceUrl, sourceType, confidence: 0.58 });
  if (mount) specs.mountingPattern = createExtractedSpec({ value: mount, unit: 'mm', sourceUrl, sourceType, confidence: 0.66 });

  if (!specs.cellCount) {
    specs.cellCount = createUnknownSpec({
      unit: 'S',
      sourceUrl,
      sourceType,
      extractionMethod: 'regex',
      confidence: 0.2,
    });
  }

  return specs;
}

function rejectionReasonForEvidence(specs: EvidenceSpecRecord): string | undefined {
  const escAmp = specs.escAmp?.value;
  if (typeof escAmp === 'number' && escAmp > 200) return 'Rejected impossible ESC current rating.';
  const kv = specs.kv?.value;
  if (typeof kv === 'number' && kv > 12000) return 'Rejected impossible motor KV rating.';
  return undefined;
}
```

- [ ] **Step 4: Use evidence specs in `normalizeProduct`**

Inside `normalizeProduct`, after `const specs = parseSpecs(text);`, add:

```ts
  const evidenceSpecs = parseEvidenceSpecs(text, candidate.url);
  const rejectionReason = rejectionReasonForEvidence(evidenceSpecs);
  if (rejectionReason) return undefined;
```

Add `evidenceSpecs` and `trustStatus` to returned product:

```ts
    trustStatus: 'QUARANTINE',
    evidenceSpecs,
```

Update the rejection collection in `extractProductsFromMarkdown` so rejected candidates get the precise reason:

```ts
const evidenceSpecs = parseEvidenceSpecs(`${candidate.name} ${candidate.context}`, candidate.url);
const rejectionReason = rejectionReasonForEvidence(evidenceSpecs);
if (rejectionReason) {
  rejected.push({ name: candidate.name, reason: rejectionReason });
  continue;
}
```

Place that block before calling `normalizeProduct(candidate, input)`.

- [ ] **Step 5: Normalize evidence specs in `crawler-product-catalog.ts`**

Import:

```ts
import { EvidenceSpecRecordSchema, type EvidenceSpecRecord } from '@/lib/types/spec-trust';
```

Add:

```ts
function asEvidenceSpecs(value: unknown): EvidenceSpecRecord | undefined {
  const parsed = EvidenceSpecRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
```

Add to returned product:

```ts
    trustStatus: record.trustStatus === 'VERIFIED' || record.trustStatus === 'REVIEW_REQUIRED' || record.trustStatus === 'REJECTED'
      ? record.trustStatus
      : 'QUARANTINE',
    evidenceSpecs: asEvidenceSpecs(record.evidenceSpecs),
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm run spec-trust:test
npm run tools:part-matcher:test
npx tsc --noEmit
npm run lint:ci
```

Expected: all pass.

Commit:

```bash
git add src/lib/tools/product-catalog-extractor.ts src/lib/tools/crawler-product-catalog.ts scripts/spec-trust-regression-test.ts
git commit -m "feat: wrap crawler specs with trust evidence"
```

## Task 4: Quarantine Ingestion and Conflict Detection Service

**Files:**
- Create: `src/lib/services/catalog-ingester.ts`
- Modify: `src/app/api/admin/catalog/extract/route.ts`
- Test: `scripts/spec-trust-regression-test.ts`

- [ ] **Step 1: Add failing conflict tests**

Append to `scripts/spec-trust-regression-test.ts`:

```ts
import {
  detectSpecConflicts,
  prepareCatalogIngestionRecord,
} from '../src/lib/services/catalog-ingester';

test('catalog ingester inserts new records as quarantine', () => {
  const record = prepareCatalogIngestionRecord(baseProduct);
  assert.equal(record.trustStatus, 'QUARANTINE');
  assert.deepEqual(record.conflictLog, []);
});

test('catalog ingester marks conflicting critical values for review', () => {
  const existing: FpvCatalogProduct = {
    ...baseProduct,
    trustStatus: 'VERIFIED',
    evidenceSpecs: {
      kv: createVerifiedSpec({
        value: 1850,
        unit: 'KV',
        sourceUrl: 'https://example.com/manual-a',
        sourceType: 'manual',
        extractionMethod: 'manual_override',
        confidence: 0.99,
      }),
    },
  };
  const incoming: FpvCatalogProduct = {
    ...baseProduct,
    evidenceSpecs: {
      kv: createVerifiedSpec({
        value: 1960,
        unit: 'KV',
        sourceUrl: 'https://example.com/manual-b',
        sourceType: 'manual',
        extractionMethod: 'manual_override',
        confidence: 0.99,
      }),
    },
  };

  const conflicts = detectSpecConflicts(existing, incoming, '2026-06-29T12:00:00.000Z');
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].field, 'kv');
  assert.equal(conflicts[0].existingValue, 1850);
  assert.equal(conflicts[0].incomingValue, 1960);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run spec-trust:test
```

Expected: FAIL because `catalog-ingester.ts` does not exist.

- [ ] **Step 3: Create `src/lib/services/catalog-ingester.ts`**

```ts
import type { FpvCatalogProduct } from '@/lib/tools/fpv-product-types';
import { isEvidenceBoundSpec, type ProductTrustStatus } from '@/lib/types/spec-trust';

export type CatalogConflict = {
  field: string;
  existingValue: unknown;
  incomingValue: unknown;
  sourceUrls: string[];
  detectedAt: string;
};

export type CatalogIngestionRecord = {
  product: FpvCatalogProduct;
  trustStatus: ProductTrustStatus;
  conflictLog: CatalogConflict[];
};

const CRITICAL_FIELDS = new Set([
  'kv',
  'escAmp',
  'continuousAmp',
  'burstAmp',
  'cellCount',
  'maxCellCount',
  'mount',
  'mountingPattern',
  'connector',
  'protocol',
  'firmware',
]);

function comparableValue(value: unknown): string {
  return JSON.stringify(value);
}

export function detectSpecConflicts(
  existing: FpvCatalogProduct,
  incoming: FpvCatalogProduct,
  detectedAt = new Date().toISOString(),
): CatalogConflict[] {
  const conflicts: CatalogConflict[] = [];
  const fields = new Set([
    ...Object.keys(existing.evidenceSpecs || {}),
    ...Object.keys(incoming.evidenceSpecs || {}),
  ]);

  for (const field of fields) {
    if (!CRITICAL_FIELDS.has(field)) continue;
    const existingSpec = existing.evidenceSpecs?.[field];
    const incomingSpec = incoming.evidenceSpecs?.[field];
    if (!isEvidenceBoundSpec(existingSpec) || !isEvidenceBoundSpec(incomingSpec)) continue;
    if (existingSpec.value === null || incomingSpec.value === null) continue;
    if (comparableValue(existingSpec.value) === comparableValue(incomingSpec.value)) continue;

    conflicts.push({
      field,
      existingValue: existingSpec.value,
      incomingValue: incomingSpec.value,
      sourceUrls: [...existingSpec.sourceUrls, ...incomingSpec.sourceUrls],
      detectedAt,
    });
  }

  return conflicts;
}

export function prepareCatalogIngestionRecord(
  incoming: FpvCatalogProduct,
  existing?: FpvCatalogProduct,
): CatalogIngestionRecord {
  if (!existing) {
    return {
      product: {
        ...incoming,
        trustStatus: incoming.trustStatus || 'QUARANTINE',
        conflictLog: incoming.conflictLog || [],
      },
      trustStatus: incoming.trustStatus || 'QUARANTINE',
      conflictLog: incoming.conflictLog || [],
    };
  }

  const conflicts = detectSpecConflicts(existing, incoming);
  const trustStatus: ProductTrustStatus = conflicts.length ? 'REVIEW_REQUIRED' : existing.trustStatus || 'QUARANTINE';
  const conflictLog = [...(existing.conflictLog || []), ...conflicts];

  return {
    product: {
      ...existing,
      ...incoming,
      trustStatus,
      conflictLog,
    },
    trustStatus,
    conflictLog,
  };
}
```

- [ ] **Step 4: Wire admin catalog extraction response**

In `src/app/api/admin/catalog/extract/route.ts`, import:

```ts
import { prepareCatalogIngestionRecord } from '@/lib/services/catalog-ingester';
```

Before returning `products`, map them:

```ts
const trustedProducts = extraction.products.map((product) => prepareCatalogIngestionRecord(product).product);
```

Use `trustedProducts` wherever products are written or returned:

```ts
const catalog = write ? upsertCrawlerProductCatalog(trustedProducts) : undefined;
```

Response:

```ts
products: trustedProducts,
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm run spec-trust:test
npm run catalog:extract
npx tsc --noEmit
npm run lint:ci
```

Expected: tests pass. `catalog:extract` may report no queued input depending on local data; it must not crash from type or runtime import errors.

Commit:

```bash
git add src/lib/services/catalog-ingester.ts src/app/api/admin/catalog/extract/route.ts scripts/spec-trust-regression-test.ts
git commit -m "feat: quarantine catalog ingestion records"
```

## Task 5: Tool Engineering-Safety Guardrails

**Files:**
- Modify: `src/lib/tools/component-compatibility.ts`
- Modify: `src/app/api/tools/part-matcher/route.ts`
- Modify: `src/app/api/tools/hardware-analyzer/route.ts`
- Test: `scripts/spec-trust-regression-test.ts`

- [ ] **Step 1: Add failing tool safety tests**

Append to `scripts/spec-trust-regression-test.ts`:

```ts
import { analyzeBuildCompatibility } from '../src/lib/tools/component-compatibility';

test('build compatibility is not engineering-safe with legacy primitive-only specs', () => {
  const frame: FpvCatalogProduct = { ...baseProduct, id: 'frame', type: 'frame', category: 'frame', specs: { propSize: 5 }, fit: { styles: ['freestyle'], propSizes: [5] } };
  const motor: FpvCatalogProduct = { ...baseProduct, id: 'motor', type: 'motor', category: 'motor', specs: { kv: 1850, propSize: 5 }, fit: { styles: ['freestyle'], cellCounts: [6], propSizes: [5] } };
  const prop: FpvCatalogProduct = { ...baseProduct, id: 'prop', type: 'prop', category: 'prop', specs: { diameter: 5, pitch: 3.6 }, fit: { styles: ['freestyle'], propSizes: [5] } };
  const stack: FpvCatalogProduct = { ...baseProduct, id: 'stack', type: 'stack', category: 'stack', specs: { escAmp: 45 }, fit: { styles: ['freestyle'], cellCounts: [6] } };
  const battery: FpvCatalogProduct = { ...baseProduct, id: 'battery', type: 'battery', category: 'battery', specs: { cellCount: 6, capacityMah: 1100 }, fit: { styles: ['freestyle'], cellCounts: [6] } };

  const result = analyzeBuildCompatibility(
    { style: 'freestyle', frame: 'frame', motor: 'motor', prop: 'prop', stack: 'stack', battery: 'battery' },
    [frame, motor, prop, stack, battery],
  );

  assert.equal(result.isEngineeringSafe, false);
  assert.match(result.engineeringWarning || '', /unverified/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run spec-trust:test
```

Expected: FAIL because `BuildCompatibilityResult` has no `isEngineeringSafe` or `engineeringWarning`.

- [ ] **Step 3: Update `BuildCompatibilityResult`**

In `src/lib/tools/component-compatibility.ts`, import:

```ts
import { hasVerifiedCriticalSpecs } from '@/lib/tools/spec-trust-legacy';
```

Add fields to `BuildCompatibilityResult`:

```ts
  isEngineeringSafe: boolean;
  engineeringWarning?: string;
```

Add helper:

```ts
function selectedBuildIsEngineeringSafe(selected: Partial<Record<BuildSlot, FpvCatalogProduct>>): boolean {
  return hasVerifiedCriticalSpecs(selected.motor, ['kv'])
    && hasVerifiedCriticalSpecs(selected.battery, ['cellCount'])
    && hasVerifiedCriticalSpecs(selected.stack, ['escAmp'])
    && hasVerifiedCriticalSpecs(selected.prop, ['propSize'])
    && Boolean(selected.frame);
}
```

Before return in `analyzeBuildCompatibility`:

```ts
  const isEngineeringSafe = selectedBuildIsEngineeringSafe(selected);
  const engineeringWarning = isEngineeringSafe
    ? undefined
    : 'Contains unverified specs. Check manufacturer manual before powering up.';
```

Add to returned object:

```ts
    isEngineeringSafe,
    engineeringWarning,
```

- [ ] **Step 4: Attach safety state in Part Matcher API**

In `src/app/api/tools/part-matcher/route.ts`, locate the response JSON for deterministic/local compatibility. Add:

```ts
isEngineeringSafe: result.isEngineeringSafe,
engineeringWarning: result.engineeringWarning,
```

If the route returns an LLM-enhanced response, preserve the same fields from deterministic `result`.

- [ ] **Step 5: Attach safety state in Hardware Analyzer API**

In `src/app/api/tools/hardware-analyzer/route.ts`, locate the compatibility result response. Add:

```ts
isEngineeringSafe: compatibility.isEngineeringSafe,
engineeringWarning: compatibility.engineeringWarning,
```

If the route returns Markdown, include one safety sentence before the model answer when not safe:

```ts
const safetyNotice = compatibility.isEngineeringSafe
  ? ''
  : `\\n\\n> Engineering safety notice: ${compatibility.engineeringWarning}\\n`;
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm run spec-trust:test
npm run tools:part-matcher:test
npx tsc --noEmit
npm run lint:ci
```

Expected: all pass.

Commit:

```bash
git add src/lib/tools/component-compatibility.ts src/app/api/tools/part-matcher/route.ts src/app/api/tools/hardware-analyzer/route.ts scripts/spec-trust-regression-test.ts
git commit -m "feat: guard product tools with spec trust"
```

## Task 6: Final Verification, Documentation, and Handoff

**Files:**
- Modify: `PROJECT_MEMORY.md`
- Modify: `NEXT_ACTIONS.md`
- Test: repository gates

- [ ] **Step 1: Update project memory**

Add a bullet near the current affiliate/trust notes in `PROJECT_MEMORY.md`:

```md
- Technical Spec Trust Layer foundation added on 2026-06-29. Product specs now have evidence-bound schema support, quarantine/review/verified/rejected trust states, conflict detection, legacy-safe serializers, and tool-level engineering-safety warnings. Commercial affiliate expansion should use verified/spec-analysis labels rather than treating crawler or retailer data as confirmed.
```

- [ ] **Step 2: Update next actions**

Add to `NEXT_ACTIONS.md`:

```md
- Next commercial phase: improve buyer guides, comparisons, and affiliate CTAs using verified/spec-analysis labels from the Technical Spec Trust Layer. Do not describe unverified product specs as engineering-safe.
```

- [ ] **Step 3: Run full relevant gates**

Run:

```bash
npm run spec-trust:test
npm run tools:part-matcher:test
npm run tools:audit
npm run content:audit
npm run metadata:audit
npm run routes:audit
npx tsc --noEmit
npm run lint:ci
npm run build
```

Expected:

- all tests pass;
- build may log local PostgreSQL DNS fallback if production DB hostname is unavailable locally;
- build exits with code `0`.

- [ ] **Step 4: Commit and push**

Commit:

```bash
git add PROJECT_MEMORY.md NEXT_ACTIONS.md
git commit -m "docs: record spec trust foundation"
git push
```

- [ ] **Step 5: Production verification after deploy**

After user deploys through Coolify, verify:

```text
https://fpvlovers.com.tr/tools/part-matcher
https://fpvlovers.com.tr/tools/hardware-analyzer
https://fpvlovers.com.tr/article/best-fpv-goggles-2026
```

Expected:

- public pages still render;
- no console errors;
- product tool outputs include engineering-safety warnings when using unverified specs;
- no affiliate or article page claims unverified specs are manufacturer-confirmed.

## Self-Review

- Spec coverage: The plan covers evidence-bound schemas, SQL migration, extraction/normalization, quarantine ingestion, conflict detection, tool guardrails, UI compatibility serializers, tests, docs, and final verification.
- Scope control: The plan intentionally excludes a full manual review admin UI and does not rewrite commercial content during this foundation phase.
- Type consistency: `EvidenceBoundSpec`, `EvidenceSpecRecord`, `ProductTrustStatus`, `trustStatus`, `conflictLog`, `isEngineeringSafe`, and `engineeringWarning` are named consistently across tasks.
- Placeholder scan: No task relies on unspecified future work. Every implementation task includes file paths, code content, commands, and expected results.

import assert from 'node:assert/strict';
import { analyzeBuildCompatibility } from '../src/lib/tools/component-compatibility';
import type { FpvCatalogProduct } from '../src/lib/tools/fpv-product-types';
import { createVerifiedSpec } from '../src/lib/types/spec-trust';

function product(input: Partial<FpvCatalogProduct> & Pick<FpvCatalogProduct, 'id' | 'name' | 'type'>): FpvCatalogProduct {
  return {
    brand: 'Test',
    category: input.type,
    sourceNetwork: 'test',
    url: `https://example.com/${input.id}`,
    price: 1,
    currency: 'USD',
    trustScore: 90,
    keywords: [],
    compatibleWith: [],
    tags: [],
    specs: {},
    fit: { styles: ['freestyle'] },
    ...input,
  };
}

const catalog: FpvCatalogProduct[] = [
  product({ id: 'frame', name: '5 inch frame', type: 'frame', specs: { propSize: 5 }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({ id: 'motor', name: '6S motor', type: 'motor', specs: { kv: 1850, propSize: 5, cellCounts: [6] }, fit: { styles: ['freestyle'], cellCounts: [6], propSizes: [5] } }),
  product({ id: 'prop', name: '5 inch prop', type: 'prop', specs: { diameter: 5, pitch: 3.7, weight: 4.4 }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({ id: 'stack', name: '50A stack', type: 'stack', specs: { escAmp: 50 }, fit: { styles: ['freestyle'], cellCounts: [4, 6] } }),
  product({ id: 'battery-unknown', name: 'Battery without explicit cells', type: 'battery', specs: { capacityMah: 1300, cRating: 100, weight: 210 }, fit: { styles: ['freestyle'] } }),
];

const result = analyzeBuildCompatibility({
  style: 'freestyle',
  frame: 'frame',
  motor: 'motor',
  prop: 'prop',
  stack: 'stack',
  battery: 'battery-unknown',
}, catalog);

const cellCheck = result.checks.find((check) => check.label === 'Motor / battery cells');

assert.equal(cellCheck?.status, 'warn');
assert.match(cellCheck?.detail || '', /cell count/i);
// Unverified evidence is a caution signal ("confirm before buying"), not the
// same claim as "blocked" (a detected conflict) — see component-compatibility.ts.
assert.equal(result.verdict, 'caution');
assert.equal(result.engineeringSafety.isEngineeringSafe, false);
assert.ok(result.engineeringSafety.unverifiedFields.includes('battery.cellCount'));

const completeRawCatalog = [
  product({ id: 'raw-frame', name: 'Raw frame', type: 'frame', specs: { propSize: 5, weight: 130 }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({ id: 'raw-motor', name: 'Raw motor', type: 'motor', specs: { kv: 1850, propSize: 5, weight: 32, cellCounts: [6] }, fit: { styles: ['freestyle'], cellCounts: [6], propSizes: [5] } }),
  product({ id: 'raw-prop', name: 'Raw prop', type: 'prop', specs: { diameter: 5, pitch: 3.7, weight: 4.4 }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({ id: 'raw-stack', name: 'Raw stack', type: 'stack', specs: { escAmp: 50 }, fit: { styles: ['freestyle'], cellCounts: [6] } }),
  product({ id: 'raw-battery', name: 'Raw battery', type: 'battery', specs: { cellCount: 6, capacityMah: 1300, cRating: 100, weight: 220 }, fit: { styles: ['freestyle'], cellCounts: [6] } }),
];

const unverifiedCompleteResult = analyzeBuildCompatibility({
  style: 'freestyle',
  frame: 'raw-frame',
  motor: 'raw-motor',
  prop: 'raw-prop',
  stack: 'raw-stack',
  battery: 'raw-battery',
}, completeRawCatalog);

// Every slot matches and specs are internally consistent — the only gap is
// that none of it is manufacturer-verified evidence, so this is caution, not blocked.
assert.equal(unverifiedCompleteResult.verdict, 'caution');
assert.ok(unverifiedCompleteResult.score < 100);
assert.equal(unverifiedCompleteResult.calculator, undefined);
assert.equal(unverifiedCompleteResult.engineeringSafety.isEngineeringSafe, false);

// A genuine, evidence-verified conflict must still block — downgrading the
// universal "unverified evidence" check to a warning must not swallow real fails.
function verifiedSpec(value: number | number[], sourceUrl: string) {
  return createVerifiedSpec({
    value,
    unit: null,
    sourceUrls: [sourceUrl],
    sourceType: 'manufacturer',
    confidence: 1,
    extractionMethod: 'manual_override',
  });
}

const conflictCatalog = [
  product({ id: 'conflict-frame', name: 'Verified frame', type: 'frame', specs: { propSize: 5 }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({
    id: 'conflict-motor', name: 'Verified 4S-only motor', type: 'motor',
    specs: { kv: 2400, propSize: 5, cellCounts: [4] },
    evidenceSpecs: { kv: verifiedSpec(2400, 'https://example.com/motor-spec'), cellCounts: verifiedSpec([4], 'https://example.com/motor-spec') },
    fit: { styles: ['freestyle'], cellCounts: [4], propSizes: [5] },
  }),
  product({ id: 'conflict-prop', name: 'Verified prop', type: 'prop', specs: { diameter: 5 }, evidenceSpecs: { diameter: verifiedSpec(5, 'https://example.com/prop-spec') }, fit: { styles: ['freestyle'], propSizes: [5] } }),
  product({ id: 'conflict-stack', name: 'Verified stack', type: 'stack', specs: { escAmp: 50 }, evidenceSpecs: { escAmp: verifiedSpec(50, 'https://example.com/stack-spec') }, fit: { styles: ['freestyle'], cellCounts: [4, 6] } }),
  product({
    id: 'conflict-battery', name: 'Verified 6S battery', type: 'battery',
    specs: { cellCount: 6, capacityMah: 1300, cRating: 100, weight: 220 },
    fit: { styles: ['freestyle'], cellCounts: [6] },
  }),
];

const conflictResult = analyzeBuildCompatibility({
  style: 'freestyle',
  frame: 'conflict-frame',
  motor: 'conflict-motor',
  prop: 'conflict-prop',
  stack: 'conflict-stack',
  battery: 'conflict-battery',
}, conflictCatalog);

const conflictCellCheck = conflictResult.checks.find((check) => check.label === 'Motor / battery cells');
assert.equal(conflictCellCheck?.status, 'fail');
assert.equal(conflictResult.verdict, 'blocked');

console.log('part-matcher regression checks passed');

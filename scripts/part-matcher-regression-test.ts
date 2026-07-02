import assert from 'node:assert/strict';
import { analyzeBuildCompatibility } from '../src/lib/tools/component-compatibility';
import type { FpvCatalogProduct } from '../src/lib/tools/fpv-product-types';

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
assert.equal(result.verdict, 'caution');
assert.equal(result.engineeringSafety.isEngineeringSafe, false);
assert.ok(result.engineeringSafety.unverifiedFields.includes('battery.cellCount'));

console.log('part-matcher regression checks passed');

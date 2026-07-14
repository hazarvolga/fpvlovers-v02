import assert from 'node:assert/strict';
import { calculateBuild, getSafeKvRange } from '../src/lib/tools/build-calculator';

const result = calculateBuild({
  style: 'whoop',
  frameWeight: 5,
  motorWeight: 3,
  stackWeight: 4,
  videoWeight: 4,
  propWeight: 1,
  batteryWeight: 12,
  payloadWeight: 0,
  cellCount: 1,
  batteryCapacityMah: 300,
  batteryCRating: 50,
  motorKv: 19000,
  propDiameter: 1.6,
  propPitch: 1.5,
  escAmpRating: 5,
});

assert.equal(result.nominalVoltage, 3.7);
assert.equal(result.fullVoltage, 4.2);
assert.equal(result.safeKvRange.min, getSafeKvRange(1, 1.6).min);
assert.ok(result.safeKvRange.max > result.safeKvRange.min);

console.log('build calculator regression checks passed');

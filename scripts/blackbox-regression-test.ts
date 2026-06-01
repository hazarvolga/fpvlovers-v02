import assert from 'node:assert/strict';
import {
  analyzeBlackboxTuning,
  isUnsupportedBlackboxBinaryFile,
  summarizeBlackboxText,
} from '../src/lib/tools/blackbox-tuning';

const csvSummary = summarizeBlackboxText(
  'short-hop.csv',
  [
    'time,gyroADC[0],gyroADC[1],setpoint[0],motor[0],debug[0],throttle',
    '0.01,120,90,100,1040,0,0.32',
    '0.02,150,92,112,1080,2,0.41',
  ].join('\n'),
);

assert.equal(csvSummary?.format, 'csv');
assert.deepEqual(csvSummary?.columns.slice(0, 4), ['time', 'gyroADC[0]', 'gyroADC[1]', 'setpoint[0]']);
assert.ok(csvSummary?.detectedSignals.includes('gyro'));
assert.ok(csvSummary?.detectedSignals.includes('motor'));

const textSummary = summarizeBlackboxText(
  'cli-dump.log',
  'Gyro traces show 180Hz resonance. D-term noise rises after throttle punchout and motors are hot.',
);

assert.equal(textSummary?.format, 'text');
assert.ok(textSummary?.detectedSignals.includes('dterm'));
assert.ok(textSummary?.detectedSignals.includes('throttle'));

assert.equal(isUnsupportedBlackboxBinaryFile('flight.bbl'), true);
assert.equal(isUnsupportedBlackboxBinaryFile('flight.BFL'), true);
assert.equal(isUnsupportedBlackboxBinaryFile('flight.csv'), false);

const hotMotorResult = analyzeBlackboxTuning({
  droneType: '5 inch freestyle',
  batterySpec: '6S',
  problem: 'Hot motors after throttle punchout',
  logData: 'Gyro resonance around 190Hz and D-term noise, possible desync.',
  currentPIDs: 'P: 45, I: 80, D: 42, FF: 105',
});

assert.equal(hotMotorResult.riskLevel, 'high');
assert.ok(hotMotorResult.proposedSettings.d < 42);
assert.ok(hotMotorResult.detectedIssues.some((issue) => issue.toLowerCase().includes('motor heat')));

console.log('Blackbox regression tests passed.');

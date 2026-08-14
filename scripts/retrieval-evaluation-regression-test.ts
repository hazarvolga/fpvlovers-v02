import assert from 'node:assert/strict';
import { evaluateRetrievalCase, summarizeRetrievalEval } from '../src/lib/retrieval-evaluation';

const testCase = {
  id: 'pid-grounding',
  dataset: 'fpv-flight-tuning',
  query: 'propwash PID filtering',
  expectedAnyTerms: ['propwash', 'pid'],
  minResults: 1,
  minTopScore: 0.5,
};

const passing = evaluateRetrievalCase(testCase, [{
  score: 0.82,
  content: 'Reduce propwash by validating PID and filter settings.',
  documentName: 'tuning-guide.md',
  sourceUrl: 'https://betaflight.com/docs/wiki',
}]);
assert.equal(passing.passed, true);
assert.deepEqual(passing.matchedTerms, ['propwash', 'pid']);
assert.equal(passing.sourceCoverage, 1);

const irrelevant = evaluateRetrievalCase(testCase, [{
  score: 0.9,
  content: 'Unrelated product announcement.',
  documentName: 'news.md',
}]);
assert.equal(irrelevant.passed, false);
assert.ok(irrelevant.failures.includes('none of the expected terms appeared in retrieved content'));

const summary = summarizeRetrievalEval([passing, irrelevant]);
assert.equal(summary.total, 2);
assert.equal(summary.passRate, 0.5);
assert.equal(summary.averageSourceCoverage, 0.5);

console.log('Retrieval evaluation regression test passed.');

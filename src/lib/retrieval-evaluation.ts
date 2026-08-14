export type RetrievalEvalCase = {
  id: string;
  dataset: string;
  query: string;
  expectedAnyTerms: string[];
  minResults: number;
  minTopScore: number;
};

export type RetrievalEvalRecord = {
  score: number;
  content: string;
  documentName: string;
  sourceUrl?: string;
};

export type RetrievalEvalCaseResult = {
  id: string;
  dataset: string;
  query: string;
  passed: boolean;
  count: number;
  topScore: number;
  matchedTerms: string[];
  sourceCoverage: number;
  uniqueDocuments: number;
  failures: string[];
};

export function evaluateRetrievalCase(
  testCase: RetrievalEvalCase,
  records: readonly RetrievalEvalRecord[],
): RetrievalEvalCaseResult {
  const topScore = records.length > 0 ? Math.max(...records.map((record) => record.score)) : 0;
  const searchable = records.map((record) => record.content.toLowerCase()).join('\n');
  const matchedTerms = testCase.expectedAnyTerms.filter((term) => searchable.includes(term.toLowerCase()));
  const sourceCoverage = records.length > 0
    ? records.filter((record) => Boolean(record.sourceUrl)).length / records.length
    : 0;
  const failures: string[] = [];

  if (records.length < testCase.minResults) failures.push(`results ${records.length} < ${testCase.minResults}`);
  if (topScore < testCase.minTopScore) failures.push(`topScore ${topScore.toFixed(3)} < ${testCase.minTopScore.toFixed(3)}`);
  if (matchedTerms.length === 0) failures.push('none of the expected terms appeared in retrieved content');

  return {
    id: testCase.id,
    dataset: testCase.dataset,
    query: testCase.query,
    passed: failures.length === 0,
    count: records.length,
    topScore: Math.round(topScore * 1000) / 1000,
    matchedTerms,
    sourceCoverage: Math.round(sourceCoverage * 1000) / 1000,
    uniqueDocuments: new Set(records.map((record) => record.documentName)).size,
    failures,
  };
}

export function summarizeRetrievalEval(results: readonly RetrievalEvalCaseResult[]) {
  const passed = results.filter((result) => result.passed).length;
  const averageTopScore = results.length > 0
    ? results.reduce((sum, result) => sum + result.topScore, 0) / results.length
    : 0;
  const averageSourceCoverage = results.length > 0
    ? results.reduce((sum, result) => sum + result.sourceCoverage, 0) / results.length
    : 0;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length > 0 ? Math.round((passed / results.length) * 1000) / 1000 : 0,
    averageTopScore: Math.round(averageTopScore * 1000) / 1000,
    averageSourceCoverage: Math.round(averageSourceCoverage * 1000) / 1000,
  };
}

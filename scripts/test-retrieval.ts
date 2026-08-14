import fs from 'node:fs';
import { DATASETS } from '../src/lib/master-routing-tables';
import {
  buildDifyRetrievalModel,
  DEFAULT_CONFIGS,
  resolveDifyDatasetId,
} from '../src/lib/retrieval-orchestrator';
import {
  evaluateRetrievalCase,
  summarizeRetrievalEval,
  type RetrievalEvalCase,
  type RetrievalEvalRecord,
} from '../src/lib/retrieval-evaluation';

const currentYear = new Date().getUTCFullYear();

const TEST_CASES: RetrievalEvalCase[] = [
  { id: 'tuning-propwash', dataset: 'fpv-flight-tuning', query: 'Betaflight propwash reduction and PID filtering', expectedAnyTerms: ['propwash', 'pid', 'filter'], minResults: 1, minTopScore: 0.2 },
  { id: 'pid-cinewhoop', dataset: 'fpv-pid-profiles', query: 'cinewhoop PID profile and filter setup', expectedAnyTerms: ['cinewhoop', 'pid', 'filter'], minResults: 1, minTopScore: 0.2 },
  { id: 'troubleshooting-flip', dataset: 'fpv-troubleshooting', query: 'FPV drone flips on takeoff troubleshooting', expectedAnyTerms: ['motor', 'prop', 'orientation'], minResults: 1, minTopScore: 0.2 },
  { id: 'components-f405', dataset: 'fpv-components-specs', query: 'SpeedyBee F405 flight controller specifications', expectedAnyTerms: ['speedybee', 'f405'], minResults: 1, minTopScore: 0.2 },
  { id: 'build-five-inch', dataset: 'fpv-build-guides', query: 'how to build and solder a five inch FPV drone', expectedAnyTerms: ['solder', 'flight controller', 'esc'], minResults: 1, minTopScore: 0.2 },
  { id: 'reviews-current', dataset: 'fpv-news-reviews', query: `DJI O4 Air Unit review ${currentYear}`, expectedAnyTerms: ['dji', 'o4'], minResults: 1, minTopScore: 0.2 },
  { id: 'racing-current', dataset: 'fpv-racing-events', query: `MultiGP FPV racing events ${currentYear}`, expectedAnyTerms: ['multigp', 'race', 'racing'], minResults: 1, minTopScore: 0.2 },
  { id: 'community-beginner', dataset: 'fpv-community-knowledge', query: 'best FPV simulator practice plan for beginners', expectedAnyTerms: ['simulator', 'beginner', 'practice'], minResults: 1, minTopScore: 0.2 },
  { id: 'regulations-current', dataset: 'fpv-regulations', query: `SHGM IHA kayit kurallari ${currentYear}`, expectedAnyTerms: ['shgm', 'kayit', 'iha'], minResults: 1, minTopScore: 0.2 },
];

function metadataValue(metadata: unknown, key: string): string | undefined {
  if (Array.isArray(metadata)) {
    const item = metadata.find((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).name === key);
    const value = item && typeof item === 'object' ? (item as Record<string, unknown>).value : undefined;
    return typeof value === 'string' ? value : undefined;
  }
  if (metadata && typeof metadata === 'object') {
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function readRecords(value: unknown): RetrievalEvalRecord[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const records = (value as Record<string, unknown>).records;
  if (!Array.isArray(records)) return [];

  return records.flatMap((entry): RetrievalEvalRecord[] => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const segment = record.segment && typeof record.segment === 'object' && !Array.isArray(record.segment)
      ? record.segment as Record<string, unknown>
      : {};
    const document = segment.document && typeof segment.document === 'object' && !Array.isArray(segment.document)
      ? segment.document as Record<string, unknown>
      : {};
    return [{
      score: Number(record.score ?? 0),
      content: String(segment.content ?? ''),
      documentName: String(document.name ?? 'unknown-document'),
      sourceUrl: metadataValue(document.doc_metadata, 'source_url'),
    }];
  });
}

async function main(): Promise<void> {
  if (process.env.RETRIEVAL_EVAL_LIVE !== 'true') {
    throw new Error('Live retrieval eval is disabled. Set RETRIEVAL_EVAL_LIVE=true to run read-only Dify queries.');
  }

  const selectedCaseId = process.env.RETRIEVAL_EVAL_CASE_ID?.trim();
  const selectedCases = selectedCaseId
    ? TEST_CASES.filter((testCase) => testCase.id === selectedCaseId)
    : TEST_CASES;
  if (selectedCases.length === 0) throw new Error(`Unknown retrieval eval case: ${selectedCaseId}`);

  const apiKey = (process.env.DIFY_DATASET_API_KEY || process.env.DIFY_API_KEY)?.trim();
  if (!apiKey) throw new Error('DIFY_DATASET_API_KEY / DIFY_API_KEY is required for live retrieval eval.');
  const baseUrl = process.env.DIFY_BASE_URL?.trim()
    || process.env.DIFY_API_URL?.trim()
    || process.env.APP_API_URL?.trim()
    || 'https://dify.affexai.tr/v1';

  const results = [];
  for (const testCase of selectedCases) {
    const dataset = DATASETS.find((candidate) => candidate.name === testCase.dataset);
    if (!dataset) throw new Error(`Unknown eval dataset: ${testCase.dataset}`);
    const datasetId = await resolveDifyDatasetId(testCase.dataset, {
      apiKey,
      baseUrl,
      fallbackId: dataset.uuid,
    });
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/datasets/${encodeURIComponent(datasetId)}/retrieve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testCase.query,
        retrieval_model: buildDifyRetrievalModel({ ...DEFAULT_CONFIGS.default, topK: 5, maxChunksPerDataset: 5 }),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const responseBody = await response.text();
    let responseData: unknown;
    try {
      responseData = responseBody ? JSON.parse(responseBody) : undefined;
    } catch {
      responseData = undefined;
    }
    const records = response.ok ? readRecords(responseData) : [];
    const result = evaluateRetrievalCase(testCase, records);
    if (!response.ok) {
      const safeError = `HTTP ${response.status}: ${responseBody}`
        .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
        .slice(0, 240);
      result.failures.push(`Dify request failed: ${safeError}`);
    }
    result.passed = result.failures.length === 0;
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  const summary = summarizeRetrievalEval(results);
  const minimumPassRate = Number(process.env.RETRIEVAL_EVAL_MIN_PASS_RATE || 0.75);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'live-read-only',
    currentYear,
    minimumPassRate,
    summary,
    results,
  };

  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/retrieval-eval-latest.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.passRate < minimumPassRate) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import './load-local-env';
import { closePool, query } from '../src/lib/server/db';

type CandidateRow = {
  id: string;
  status: string;
  title: string | null;
  slug: string | null;
  updated_at: Date | string;
};

type RecoveryOptions = {
  apply: boolean;
  generatingMaxAgeHours: number;
  queuedMaxAgeHours: number;
};

function readNumericFlag(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;

  const value = Number.parseInt(arg.slice(prefix.length), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readOptions(): RecoveryOptions {
  return {
    apply: process.argv.includes('--apply'),
    generatingMaxAgeHours: readNumericFlag('generating-max-age-hours', 6),
    queuedMaxAgeHours: readNumericFlag('queued-max-age-hours', 24),
  };
}

async function loadCandidates(options: RecoveryOptions): Promise<CandidateRow[]> {
  const result = await query<CandidateRow>(
    `
      SELECT id, status, title, slug, updated_at
      FROM fpvlovers_app.content_jobs
      WHERE (
        status = 'generating'
        AND updated_at < NOW() - ($1::text || ' hours')::interval
      ) OR (
        status = 'queued'
        AND updated_at < NOW() - ($2::text || ' hours')::interval
      )
      ORDER BY updated_at ASC
    `,
    [options.generatingMaxAgeHours, options.queuedMaxAgeHours],
  );

  return result.rows;
}

async function applyRecovery(candidates: CandidateRow[], options: RecoveryOptions): Promise<number> {
  if (candidates.length === 0) return 0;

  const ids = candidates.map((candidate) => candidate.id);
  const reason = [
    'Automation recovery retired this stale job without deleting data.',
    `generating>${options.generatingMaxAgeHours}h`,
    `queued>${options.queuedMaxAgeHours}h`,
    `recovered_at=${new Date().toISOString()}`,
  ].join(' ');

  const result = await query(
    `
      UPDATE fpvlovers_app.content_jobs
      SET
        status = 'retired',
        error_message = $2,
        attempt_count = attempt_count + 1,
        completed_at = NOW(),
        updated_at = NOW(),
        brief = jsonb_set(
          COALESCE(brief, '{}'::jsonb),
          '{automationRecovery}',
          jsonb_build_object(
            'reason', $2::text,
            'previousStatus', status,
            'recoveredAt', NOW()
          ),
          true
        )
      WHERE id = ANY($1::text[])
      RETURNING id
    `,
    [ids, reason],
  );

  await query(
    `
      INSERT INTO fpvlovers_app.automation_runs (
        kind, status, started_at, finished_at, summary, error_message
      ) VALUES (
        'generate',
        'retired_stale_jobs',
        NOW(),
        NOW(),
        $1::jsonb,
        NULL
      )
    `,
    [
      JSON.stringify({
        recovered: result.rowCount ?? 0,
        generatingMaxAgeHours: options.generatingMaxAgeHours,
        queuedMaxAgeHours: options.queuedMaxAgeHours,
        ids,
      }),
    ],
  );

  return result.rowCount ?? 0;
}

async function main(): Promise<void> {
  const options = readOptions();
  const candidates = await loadCandidates(options);

  const payload = {
    dryRun: !options.apply,
    generatingMaxAgeHours: options.generatingMaxAgeHours,
    queuedMaxAgeHours: options.queuedMaxAgeHours,
    candidateCount: candidates.length,
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      status: candidate.status,
      title: candidate.title,
      slug: candidate.slug,
      updatedAt: new Date(candidate.updated_at).toISOString(),
    })),
  };

  if (!options.apply) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const recovered = await applyRecovery(candidates, options);
  console.log(JSON.stringify({ ...payload, recovered }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error('[AutomationRecoverStaleJobs] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

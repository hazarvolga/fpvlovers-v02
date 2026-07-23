import './load-local-env';
import { closePool, query } from '../src/lib/server/db';

type CandidateRow = {
  id: string;
  slug: string | null;
  title: string | null;
  error_message: string | null;
  attempt_count: number;
  updated_at: Date | string;
};

type Options = {
  apply: boolean;
  includeNoError: boolean;
};

function readOptions(): Options {
  return {
    apply: process.argv.includes('--apply'),
    includeNoError: process.argv.includes('--include-no-error'),
  };
}

async function loadCandidates(options: Options): Promise<CandidateRow[]> {
  const result = await query<CandidateRow>(
    `
      SELECT id, slug, title, error_message, attempt_count, updated_at
      FROM fpvlovers_app.content_jobs
      WHERE status = 'failed'
        AND (
          error_message LIKE 'Automation recovery marked this stale job as failed without deleting data.%'
          OR error_message LIKE 'Automation recovery retired this stale job without deleting data.%'
          OR (
            $1::boolean
            AND error_message IS NULL
            AND attempt_count = 0
            AND updated_at < NOW() - INTERVAL '5 minutes'
          )
        )
      ORDER BY updated_at ASC, id ASC
    `,
    [options.includeNoError],
  );

  return result.rows;
}

async function retireCandidates(candidates: CandidateRow[], options: Options): Promise<number> {
  if (!options.apply || candidates.length === 0) return 0;

  const ids = candidates.map((candidate) => candidate.id);
  const reason = [
    'Historical failed content job retired without deleting data.',
    `includeNoError=${options.includeNoError}`,
    `retired_at=${new Date().toISOString()}`,
  ].join(' ');

  const result = await query(
    `
      UPDATE fpvlovers_app.content_jobs
      SET
        status = 'retired',
        error_message = COALESCE(error_message, $2),
        completed_at = COALESCE(completed_at, NOW()),
        updated_at = NOW(),
        brief = jsonb_set(
          COALESCE(brief, '{}'::jsonb),
          '{contentJobRetirement}',
          jsonb_build_object(
            'reason', $2::text,
            'previousStatus', 'failed',
            'retiredAt', NOW()
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
        'retired_resolved_content_jobs',
        NOW(),
        NOW(),
        $1::jsonb,
        NULL
      )
    `,
    [
      JSON.stringify({
        retired: result.rowCount ?? 0,
        includeNoError: options.includeNoError,
        ids,
      }),
    ],
  );

  return result.rowCount ?? 0;
}

async function main(): Promise<void> {
  const options = readOptions();
  const candidates = await loadCandidates(options);
  const retired = await retireCandidates(candidates, options);

  console.log(JSON.stringify({
    dryRun: !options.apply,
    includeNoError: options.includeNoError,
    candidateCount: candidates.length,
    retired,
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      title: candidate.title,
      hasErrorMessage: Boolean(candidate.error_message),
      attemptCount: candidate.attempt_count,
      updatedAt: new Date(candidate.updated_at).toISOString(),
    })),
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error('[RetireResolvedContentJobs] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

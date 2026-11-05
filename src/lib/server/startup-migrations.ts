import { runMigrations, type MigrationResult } from './migrations';

export type StartupMigrationOutcome = {
  ran: boolean;
  applied: string[];
  error?: string;
};

type MigrationRunner = () => Promise<MigrationResult>;

/**
 * The production container starts with `node server.js`, so `db:migrate` never
 * ran on deploy and new SQL had to be applied by hand (0010 and 0012). The
 * runner is idempotent and serialised by an advisory lock, so running it on
 * boot is safe even with several replicas.
 */
export function shouldRunStartupMigrations(env: NodeJS.ProcessEnv): boolean {
  if (env.FPV_AUTO_MIGRATE === 'false') return false;
  if (env.NEXT_PHASE === 'phase-production-build') return false;
  if (env.NODE_ENV !== 'production') return false;
  return env.FPV_STORAGE_MODE === 'dual' || env.FPV_STORAGE_MODE === 'postgres';
}

export async function runStartupMigrations(
  env: NodeJS.ProcessEnv = process.env,
  runner: MigrationRunner = () => runMigrations(),
): Promise<StartupMigrationOutcome> {
  if (!shouldRunStartupMigrations(env)) return { ran: false, applied: [] };

  try {
    const result = await runner();
    return { ran: true, applied: result.applied };
  } catch (error: unknown) {
    // A failed migration is rolled back by the runner; keep serving on the old schema.
    const message = error instanceof Error ? error.message : String(error);
    console.error('[StartupMigrations] Migration run failed, continuing with the current schema:', message);
    return { ran: false, applied: [], error: message };
  }
}

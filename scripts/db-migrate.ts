import { runMigrations } from '../src/lib/server/migrations';
import { getPool } from '../src/lib/server/db';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    const result = await runMigrations({ dryRun });
    console.log('[Migrations Script] Completed successfully!');
    console.log(`- Already applied: ${result.alreadyApplied.length}`);
    console.log(`- Newly applied: ${result.applied.length}`);
  } catch (error) {
    console.error('[Migrations Script] Migration process failed:', error);
    process.exit(1);
  } finally {
    // Make sure to close the pool if migration runner opened it
    if (!dryRun) {
      try {
        const pool = getPool();
        await pool.end();
        console.log('[Migrations Script] Database connection pool closed.');
      } catch (endError) {
        console.error('[Migrations Script] Error closing connection pool:', endError);
      }
    }
  }
}

main();

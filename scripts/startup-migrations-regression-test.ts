import assert from 'node:assert/strict';
import { runStartupMigrations, shouldRunStartupMigrations } from '../src/lib/server/startup-migrations';

const base = { NODE_ENV: 'production', FPV_STORAGE_MODE: 'dual' } as NodeJS.ProcessEnv;

assert.equal(shouldRunStartupMigrations(base), true, 'dual mode in production migrates');
assert.equal(shouldRunStartupMigrations({ ...base, FPV_STORAGE_MODE: 'postgres' }), true);
assert.equal(shouldRunStartupMigrations({ ...base, FPV_STORAGE_MODE: 'files' }), false, 'files mode has no database');
assert.equal(shouldRunStartupMigrations({ ...base, FPV_STORAGE_MODE: undefined }), false, 'unset storage mode defaults to files');
assert.equal(shouldRunStartupMigrations({ ...base, FPV_AUTO_MIGRATE: 'false' }), false, 'explicit opt-out wins');
assert.equal(shouldRunStartupMigrations({ ...base, NEXT_PHASE: 'phase-production-build' }), false, 'never during next build');
assert.equal(shouldRunStartupMigrations({ ...base, NODE_ENV: 'development' }), false, 'dev servers stay manual');

async function main() {
  let calls = 0;
  const ok = await runStartupMigrations(base, async () => {
    calls += 1;
    return { applied: ['0013'], alreadyApplied: ['0012'], skipped: [] };
  });
  assert.equal(calls, 1);
  assert.deepEqual(ok, { ran: true, applied: ['0013'] });

  const skipped = await runStartupMigrations({ ...base, FPV_AUTO_MIGRATE: 'false' }, async () => {
    throw new Error('must not run');
  });
  assert.deepEqual(skipped, { ran: false, applied: [] });

  const failed = await runStartupMigrations(base, async () => {
    throw new Error('relation already exists');
  });
  assert.deepEqual(failed, { ran: false, applied: [], error: 'relation already exists' }, 'a failing migration is reported, never thrown, so the app still boots');

  console.log('Startup migrations regression test passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

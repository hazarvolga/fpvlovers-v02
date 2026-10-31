import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const checks: { name: string; run: () => void }[] = [];
function check(name: string, run: () => void): void {
  checks.push({ name, run });
}

check('privacy migration adds newsletter consent columns', () => {
  const sql = readFileSync('db/migrations/0011_privacy_compliance_foundation.sql', 'utf8');
  for (const column of ['status', 'confirmed_at', 'consent_at', 'consent_version', 'consent_source']) {
    assert.match(sql, new RegExp(column), `missing newsletter column ${column}`);
  }
  assert.match(sql, /consent_records/);
  assert.match(sql, /terms_accepted_at/);
});

check('newsletter subscriber type carries consent state', () => {
  const source = readFileSync('src/lib/server/db-types.ts', 'utf8');
  assert.match(source, /status: 'pending' \| 'active' \| 'unsubscribed'/);
  assert.match(source, /consent_at: Date \| null/);
});

let failed = 0;
for (const { name, run } of checks) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}: ${(error as Error).message}`);
  }
}
if (failed > 0) {
  console.error(`privacy compliance test failed (${failed}/${checks.length})`);
  process.exit(1);
}
console.log(`privacy compliance test passed (${checks.length} checks)`);

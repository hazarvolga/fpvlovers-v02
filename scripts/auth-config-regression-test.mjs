import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/server/auth.config.ts', 'utf8');

assert.match(source, /AUTH_SECRET/);
assert.match(source, /NEXTAUTH_SECRET/);
assert.match(source, /isProductionRuntime/);
assert.match(source, /must be configured in production/);
assert.match(source, /at least 32 characters/);

for (const forbidden of ['ADMIN_PASS', 'FPV_DATABASE_URL', 'GEMINI_API_KEY']) {
  assert.doesNotMatch(source, new RegExp(forbidden), `${forbidden} must not be used to derive the auth secret`);
}

assert.doesNotMatch(source, /edge-fallback/i);

console.log('auth config regression test passed');

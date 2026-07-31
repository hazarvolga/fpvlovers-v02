import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/server/crawl-queue-store.ts', 'utf8');

assert.match(source, /IS NOT DISTINCT FROM/);
assert.match(source, /FOR UPDATE/);
assert.match(source, /status = 'pending'/);
assert.match(source, /retry_count = 0/);
assert.match(source, /completed_at = NULL/);
assert.match(source, /error_message = NULL/);
assert.doesNotMatch(source, /WHERE url = \$1 AND dataset_key = \$2 AND status = \$3/);

console.log('crawl queue idempotency regression test passed');

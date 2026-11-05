import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-docs-'));
  process.env.FPV_ADMIN_DOCS_DIR = dir;
  delete process.env.FPV_STORAGE_MODE; // files mode: no database needed

  const { readAdminDocument, writeAdminDocument } = await import('../src/lib/server/admin-documents');

  assert.deepEqual(await readAdminDocument('sponsors', []), [], 'missing file yields the fallback');

  await writeAdminDocument('sponsors', [{ id: 'a' }]);
  assert.deepEqual(await readAdminDocument('sponsors', []), [{ id: 'a' }], 'written data reads back');
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(dir, 'sponsors.json'), 'utf-8')),
    [{ id: 'a' }],
    'files mode persists to disk'
  );

  const repoSponsors = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sponsors.json'), 'utf-8'));
  assert.deepEqual(repoSponsors, [], 'no fabricated sponsor records ship in the repo seed');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Admin documents regression test passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

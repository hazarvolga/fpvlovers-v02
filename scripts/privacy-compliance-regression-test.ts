import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  signConfirmToken,
  signUnsubscribeToken,
  verifyConfirmToken,
  verifyUnsubscribeToken,
} from '../src/lib/newsletter/tokens';
import {
  appendUnsubscribeFooter,
  buildConfirmationEmail,
  buildListUnsubscribeHeaders,
  buildUnsubscribeUrl,
} from '../src/lib/newsletter/messages';

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
  assert.doesNotMatch(
    sql,
    /SET[^;]*consent_at/i,
    'consent_at must not be backfilled; legacy subscribers stay out of dispatch until re-consent',
  );
});

check('newsletter subscriber type carries consent state', () => {
  const source = readFileSync('src/lib/server/db-types.ts', 'utf8');
  assert.match(source, /status: 'pending' \| 'active' \| 'unsubscribed'/);
  assert.match(source, /consent_at: Date \| null/);
});

process.env.NEWSLETTER_TOKEN_SECRET = 'test-secret-with-at-least-32-characters';

check('confirm token is subscriber-bound and expires', () => {
  const expiresAt = Date.now() + 60_000;
  const token = signConfirmToken('sub-1', expiresAt);
  assert.equal(verifyConfirmToken('sub-1', token), true);
  assert.equal(verifyConfirmToken('sub-2', token), false);
  assert.equal(verifyConfirmToken('sub-1', token, expiresAt + 1), false);
  assert.equal(verifyConfirmToken('sub-1', `${token}x`), false);
});

check('unsubscribe token is stable and tamper-evident', () => {
  const token = signUnsubscribeToken('sub-1');
  assert.equal(verifyUnsubscribeToken('sub-1', token), true);
  assert.equal(verifyUnsubscribeToken('sub-2', token), false);
  assert.equal(verifyUnsubscribeToken('sub-1', `${token}x`), false);
});

check('confirmation email points at the confirm route', () => {
  const email = buildConfirmationEmail({
    baseUrl: 'https://fpvlovers.com.tr',
    subscriberId: 'sub-1',
    locale: 'tr',
  });
  assert.match(email.subject, /onay/i);
  assert.match(email.html, /\/api\/newsletter\/confirm\?/);
  assert.match(email.html, /sub-1/);
});

check('unsubscribe footer and headers are present', () => {
  const url = buildUnsubscribeUrl('https://fpvlovers.com.tr', 'sub-1');
  assert.match(url, /\/api\/newsletter\/unsubscribe\?/);
  const headers = buildListUnsubscribeHeaders(url);
  assert.equal(headers['List-Unsubscribe'], `<${url}>`);
  assert.equal(headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  const html = appendUnsubscribeFooter('<p>body</p>', url, 'tr');
  assert.match(html, /Abonelikten çık/);
  assert.match(html, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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

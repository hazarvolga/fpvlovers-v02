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
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  createConsentState,
  hasAnalyticsConsent,
  parseConsentCookie,
  serializeConsentCookie,
} from '../src/lib/consent/consent';
import { LEGAL_DOCUMENT_VERSION } from '../src/lib/legal/version';
import { isLegalControllerConfigured, type LegalController } from '../src/lib/legal/controller';
import { LEGAL_PAGE_PAIRS, legalPath } from '../src/lib/legal/paths';
import { buildLegalDocuments } from '../src/lib/legal/documents';
import { purgeExpiredPrivacyData } from '../src/lib/server/privacy-retention';

const checks: { name: string; run: () => void | Promise<void> }[] = [];
function check(name: string, run: () => void | Promise<void>): void {
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

check('subscribe requires explicit consent and creates pending rows', () => {
  const source = readFileSync('src/app/api/newsletter/subscribe/route.ts', 'utf8');
  assert.match(source, /consent: z\.literal\(true\)/);
  assert.match(source, /'pending'/);
  assert.match(source, /buildConfirmationEmail/);
  assert.doesNotMatch(source, /status: 'created'/, 'enumeration-friendly response must be removed');
});

check('dispatch sends one recipient per call with unsubscribe headers', () => {
  const source = readFileSync('src/lib/server/newsletter-orchestrator.ts', 'utf8');
  assert.match(source, /to: subscriber\.email/, 'each recipient must be sent separately');
  assert.doesNotMatch(source, /to: emails/, 'comma-joined recipient list is forbidden');
  assert.match(source, /buildUnsubscribeUrl/);
  assert.match(source, /buildListUnsubscribeHeaders/);
  assert.match(source, /consent_at IS NOT NULL/);
});

check('consent defaults to no analytics and no marketing', () => {
  const state = createConsentState({ analytics: false, marketing: false }, 'c-1', new Date('2026-10-31T00:00:00Z'));
  assert.equal(state.categories.necessary, true);
  assert.equal(hasAnalyticsConsent(state), false);
  assert.equal(CONSENT_COOKIE, 'fpv_consent');
  assert.equal(CONSENT_VERSION, '2026-10-31');
});

check('consent cookie round-trips and rejects stale versions', () => {
  const state = createConsentState({ analytics: true, marketing: false }, 'c-2', new Date('2026-10-31T00:00:00Z'));
  const parsed = parseConsentCookie(serializeConsentCookie(state));
  assert.equal(parsed?.categories.analytics, true);
  assert.equal(hasAnalyticsConsent(parsed), true);
  assert.equal(parseConsentCookie('{"version":"old","categories":{"analytics":true}}'), null);
});

check('analytics is gated in the shell and banner', () => {
  const shell = readFileSync('src/features/layout/components/RootShell.tsx', 'utf8');
  assert.doesNotMatch(shell, /<GoogleAnalytics/, 'unconditional GA render is forbidden');
  assert.match(shell, /ConsentGatedAnalytics/);
  const gate = readFileSync('src/features/layout/components/ConsentGatedAnalytics.tsx', 'utf8');
  assert.match(gate, /categories\.analytics/);
  const banner = readFileSync('src/features/layout/components/CookieBanner.tsx', 'utf8');
  assert.match(banner, /analytics: false/);
  assert.match(banner, /marketing: false/);
});

check('first-party analytics is consent-gated', () => {
  const client = readFileSync('src/lib/analytics.ts', 'utf8');
  assert.match(client, /parseConsentCookie/);
  assert.match(client, /hasAnalyticsConsent/);
  const route = readFileSync('src/app/api/analytics/event/route.ts', 'utf8');
  assert.match(route, /CONSENT_COOKIE/);
  assert.match(route, /parseConsentCookie/);
});

check('legal paths map Turkish and English documents', () => {
  assert.equal(legalPath('privacy', 'tr'), '/tr/gizlilik-politikasi');
  assert.equal(legalPath('cookies', 'tr'), '/tr/cerez-politikasi');
  assert.equal(legalPath('terms', 'tr'), '/tr/kullanim-kosullari');
  assert.equal(legalPath('kvkk', 'tr'), '/tr/kvkk-aydinlatma');
  assert.equal(legalPath('privacy', 'en'), '/privacy');
  assert.ok(LEGAL_PAGE_PAIRS.length >= 3);
});

check('controller completeness is explicit', () => {
  const complete: LegalController = { name: 'FPVLovers', address: 'Ankara, Türkiye', email: 'hello@fpvlovers.com.tr' };
  assert.equal(isLegalControllerConfigured(complete), true);
  assert.equal(isLegalControllerConfigured({ ...complete, address: '' }), false);
});

check('Turkish KVKK notice contains mandatory sections and controller details', () => {
  const controller: LegalController = { name: 'Örnek Veri Sorumlusu', address: 'Örnek Adres', email: 'kvkk@example.com', kep: 'kep@example.com' };
  const docs = buildLegalDocuments(controller);
  const kvkk = docs.tr.kvkk;
  const text = kvkk.sections.map((section) => `${section.heading}\n${section.paragraphs.join('\n')}\n${(section.bullets ?? []).join('\n')}`).join('\n');
  for (const heading of ['Veri Sorumlusu', 'Hukuki Sebepler', 'Yurt Dışına Aktarım', 'Saklama', 'Haklarınız', 'Başvuru']) {
    assert.match(text, new RegExp(heading));
  }
  assert.match(text, /Örnek Veri Sorumlusu/);
  assert.match(text, /kvkk@example\.com/);
  assert.match(docs.tr.cookies.sections.map((section) => section.heading).join(' '), /Çerez/);
  assert.match(text, /KVKK/);
});

check('English documents cover GDPR and no-sale statement', () => {
  const docs = buildLegalDocuments({ name: 'FPVLovers', address: 'Türkiye', email: 'hello@fpvlovers.com.tr' });
  const text = docs.en.privacy.sections.map((section) => `${section.heading}\n${section.paragraphs.join('\n')}`).join('\n');
  assert.match(text, /GDPR/);
  assert.match(text, /we do not sell/i);
  assert.equal(LEGAL_DOCUMENT_VERSION, '2026-10-31');
});

check('legal pages and footer wiring exist', () => {
  for (const file of [
    'src/app/tr/kvkk-aydinlatma/page.tsx',
    'src/app/tr/gizlilik-politikasi/page.tsx',
    'src/app/tr/cerez-politikasi/page.tsx',
    'src/app/tr/kullanim-kosullari/page.tsx',
    'src/app/(en)/cookie-policy/page.tsx',
  ]) {
    assert.ok(readFileSync(file, 'utf8').length > 0, `${file} must exist`);
  }
  const footer = readFileSync('src/features/layout/components/SiteFooter.tsx', 'utf8');
  assert.match(footer, /legalPath/);
  assert.match(footer, /CookiePreferencesLink/);
  const sitemap = readFileSync('src/app/sitemap.xml/route.ts', 'utf8');
  assert.match(sitemap, /LEGAL_PAGE_PAIRS/);
});

check('sitemap does not duplicate legal pages in the static list', () => {
  const sitemap = readFileSync('src/app/sitemap.xml/route.ts', 'utf8');
  assert.doesNotMatch(sitemap, /url:\s*['"`]\/(privacy|terms)['"`]/, 'legal pages must come from LEGAL_PAGE_PAIRS only');
  assert.match(sitemap, /LEGAL_PAGE_PAIRS/);
});

check('all legal pages force dynamic rendering', () => {
  for (const file of [
    'src/app/tr/kvkk-aydinlatma/page.tsx',
    'src/app/tr/gizlilik-politikasi/page.tsx',
    'src/app/tr/cerez-politikasi/page.tsx',
    'src/app/tr/kullanim-kosullari/page.tsx',
    'src/app/(en)/privacy/page.tsx',
    'src/app/(en)/terms/page.tsx',
    'src/app/(en)/cookie-policy/page.tsx',
  ]) {
    assert.match(readFileSync(file, 'utf8'), /export const dynamic = 'force-dynamic';/, `${file} must be force-dynamic`);
  }
});

check('KVKK notice declares Turkish-only alternates', () => {
  const page = readFileSync('src/app/tr/kvkk-aydinlatma/page.tsx', 'utf8');
  assert.match(page, /languages:\s*\{\s*tr:/);
  assert.doesNotMatch(page, /\ben:\s*legalPath\('kvkk'/);
});

check('legal documents avoid self-service rights wording', () => {
  const documents = readFileSync('src/lib/legal/documents.ts', 'utf8');
  assert.doesNotMatch(documents, /account menu|Hesap menüsünden/);
  assert.match(documents, /respond within 30 days/);
  assert.match(documents, /en geç 30 gün/);
});

check('retention cleanup targets only expired rows', async () => {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const now = new Date('2026-10-31T00:00:00.000Z');
  const result = await purgeExpiredPrivacyData(async (sql, params) => {
    calls.push({ sql, params });
    return { rowCount: calls.length };
  }, { now });

  assert.equal(calls.length, 5);
  assert.match(calls[0].sql, /DELETE FROM fpvlovers_analytics\.events/);
  assert.equal((calls[0].params?.[0] as Date).toISOString(), '2026-05-04T00:00:00.000Z');

  assert.match(calls[1].sql, /newsletter_subscribers/);
  assert.match(calls[1].sql, /status = 'pending'/);
  assert.match(calls[1].sql, /AND \(subscribed_at IS NULL OR subscribed_at < \$1\)/);
  assert.doesNotMatch(calls[1].sql, /'active'|'unsubscribed'/, 'pending delete must not touch other statuses');
  assert.equal((calls[1].params?.[0] as Date).toISOString(), '2026-10-01T00:00:00.000Z');

  // Legacy single-opt-in rows are never mailed, so they must not live forever.
  assert.match(calls[2].sql, /status = 'active'/);
  assert.match(calls[2].sql, /consent_at IS NULL/);
  assert.match(calls[2].sql, /AND \(subscribed_at IS NULL OR subscribed_at < \$1\)/);
  assert.equal((calls[2].params?.[0] as Date).toISOString(), '2026-10-01T00:00:00.000Z');

  assert.match(calls[3].sql, /newsletter_subscribers/);
  assert.match(calls[3].sql, /status = 'unsubscribed'/);
  assert.match(calls[3].sql, /subscribed_at IS NULL OR COALESCE\(unsubscribed_at, subscribed_at\) < \$1/);
  assert.equal((calls[3].params?.[0] as Date).toISOString(), '2024-10-31T00:00:00.000Z');

  assert.match(calls[4].sql, /DELETE FROM fpvlovers_app\.consent_records/);
  assert.equal((calls[4].params?.[0] as Date).toISOString(), '2021-10-31T00:00:00.000Z');
  assert.deepEqual(result, {
    analyticsEvents: 1,
    pendingSubscribers: 2,
    legacyUnconfirmedSubscribers: 3,
    unsubscribedSubscribers: 4,
    consentRecords: 5,
  });
});

check('retention cleanup rejects non-positive windows', async () => {
  await assert.rejects(
    () => purgeExpiredPrivacyData(async () => ({ rowCount: 0 }), { analyticsDays: 0 }),
    /Retention windows must be positive/,
  );
  await assert.rejects(
    () => purgeExpiredPrivacyData(async () => ({ rowCount: 0 }), { unsubscribeProofYears: 0 }),
    /Retention windows must be positive/,
  );
});

check('newsletter widget requires a consent checkbox', () => {
  const source = readFileSync('src/features/tools/components/NewsletterWidget.tsx', 'utf8');
  assert.match(source, /consent:/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /legalPath\('kvkk', locale\)/);
});

check('contact form and API require a privacy acknowledgement', () => {
  const form = readFileSync('src/app/(en)/contact/ContactForm.tsx', 'utf8');
  assert.match(form, /privacyAcknowledged/);
  assert.match(form, /legalPath\('privacy', 'en'\)/);
  const route = readFileSync('src/app/api/contact/route.ts', 'utf8');
  assert.match(route, /privacyAcknowledged !== true/);
});

check('registration records terms and age attestation', () => {
  const page = readFileSync('src/app/(en)/auth/signin/page.tsx', 'utf8');
  assert.match(page, /acceptedTerms/);
  assert.match(page, /ageAttested/);
  const route = readFileSync('src/app/api/pilot/register/route.ts', 'utf8');
  assert.match(route, /terms_accepted_at/);
  assert.match(route, /age_attested_at/);
});

check('retention runs from an in-container cron route', () => {
  const route = readFileSync('src/app/api/admin/cron/privacy-retention/route.ts', 'utf8');
  assert.match(route, /authorizeCronRequest/);
  assert.match(route, /purgeExpiredPrivacyData\(query\)/);
});

check('CSP allows the consent-gated GA script origin', () => {
  const config = readFileSync('next.config.ts', 'utf8');
  const scriptSrc = config.match(/"script-src[^"]*"/)?.[0] ?? '';
  assert.match(scriptSrc, /https:\/\/www\.googletagmanager\.com/);
  assert.doesNotMatch(scriptSrc, /https:\/\/\*|\s\*/, 'script-src must stay an explicit allowlist');
});

check('write endpoints fail closed without a configured controller', () => {
  for (const file of [
    'src/app/api/newsletter/subscribe/route.ts',
    'src/app/api/contact/route.ts',
    'src/app/api/pilot/register/route.ts',
  ]) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /isLegalControllerConfigured\(getLegalController\(\)\)/, file);
    assert.match(source, /status: 503/, file);
  }
});

// The harness is transpiled to CommonJS, so the async runner cannot use top-level await.
async function main(): Promise<void> {
  let failed = 0;
  for (const { name, run } of checks) {
    try {
      await run();
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
}

void main();

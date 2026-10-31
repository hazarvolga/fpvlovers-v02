# KVKK + GDPR/CCPA P0 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bülten alıcı sızıntısını, rızasız analitiği ve aydınlatma eksikliğini gidererek FPVLovers'ı KVKK/GDPR/6563 açısından P0 seviyesinde uyumlu hale getirmek.

**Architecture:** Önce veri modeli ve imzalı token'lar; sonra bülten akışı (çift onay + çıkış), çerez rızası (sunucu kaydı + GA kapısı), hukuki belgeler (TR/EN ortak render) ve toplama noktalarındaki onay/aydınlatma. Tüm çalışma mevcut Next.js 15 App Router, PostgreSQL ve `node --import tsx` regresyon harness'i üzerine kurulur.

**Tech Stack:** Next.js 15.4 · React 19 · TypeScript · PostgreSQL · zod · nodemailer · `node:assert/strict` · pnpm

**Spec:** `docs/superpowers/specs/2026-10-31-kvkk-gdpr-compliance-design.md`

## Global Constraints

- Site/admin UI İngilizce kalır; kullanıcıya dönük yanıtlar Türkçedir. Hukuki metinler TR + EN yayınlanır.
- `.env` içeriğini okuma veya loglama yok. Yalnızca `.env.example` düzenlenir.
- Bülten gönderiminde alıcı adresleri asla tek `To:` başlığında birleştirilmez; her alıcıya ayrı gönderim yapılır.
- Rıza olmadan hiçbir analitik/izleme script'i yüklenmez.
- `LEGAL_CONTROLLER_*` değerleri tamamlanmadan hukuki sayfalar production'da yayınlanmaz (`notFound()`), dev'de yapılandırma uyarısı gösterilir.
- Değiştirilecek her sembol için önce: `node .gitnexus/run.cjs impact "<symbol>" --direction upstream --repo .`
- Commit öncesi: `node .gitnexus/run.cjs detect-changes --scope all --repo .` — `partial`/`truncated` temiz sayılmaz.
- Commit'ler Conventional Commits: `type(scope): description`.
- Testler append-only; mevcut check'ler silinmez.
- `pnpm` kullanılır; `npm` yok.
- Hukuki metinler avukat onayı olmadan "tamamlandı" sayılmaz; bu plan teknik altyapıyı ve taslak metinleri üretir.

---

## Dosya Haritası

**Oluşturulacak**
- `db/migrations/0011_privacy_compliance_foundation.sql`
- `src/lib/legal/version.ts`
- `src/lib/legal/controller.ts`
- `src/lib/legal/paths.ts`
- `src/lib/legal/documents.ts`
- `src/lib/legal/metadata.ts`
- `src/features/legal/components/LegalDocumentPage.tsx`
- `src/features/legal/components/LegalConfigurationNotice.tsx`
- `src/app/tr/kvkk-aydinlatma/page.tsx`
- `src/app/tr/gizlilik-politikasi/page.tsx`
- `src/app/tr/cerez-politikasi/page.tsx`
- `src/app/tr/kullanim-kosullari/page.tsx`
- `src/app/(en)/cookie-policy/page.tsx`
- `src/lib/consent/consent.ts`
- `src/features/layout/components/ConsentProvider.tsx`
- `src/features/layout/components/ConsentGatedAnalytics.tsx`
- `src/features/layout/components/CookiePreferencesLink.tsx`
- `src/app/api/consent/route.ts`
- `src/lib/newsletter/tokens.ts`
- `src/lib/newsletter/messages.ts`
- `src/app/api/newsletter/confirm/route.ts`
- `src/app/api/newsletter/unsubscribe/route.ts`
- `scripts/privacy-compliance-regression-test.ts`

**Değiştirilecek**
- `src/lib/server/db-types.ts:85-92`
- `src/lib/server/mailer.ts:18-43`
- `src/lib/server/newsletter-orchestrator.ts:58-115`
- `src/app/api/newsletter/subscribe/route.ts`
- `src/features/tools/components/NewsletterWidget.tsx`
- `src/features/layout/components/CookieBanner.tsx`
- `src/features/layout/components/RootShell.tsx`
- `src/features/layout/components/SiteFooter.tsx`
- `src/app/sitemap.xml/route.ts`
- `src/app/(en)/privacy/page.tsx`
- `src/app/(en)/terms/page.tsx`
- `src/app/(en)/contact/ContactForm.tsx`
- `src/app/api/contact/route.ts`
- `src/app/(en)/auth/signin/page.tsx`
- `src/app/api/pilot/register/route.ts`
- `package.json`
- `.env.example`
- `docs/superpowers/specs/2026-10-31-kvkk-gdpr-compliance-design.md` (durum notu)

---

## Task 1: Veri modeli ve DB tipleri

**Files:**
- Create: `db/migrations/0011_privacy_compliance_foundation.sql`
- Modify: `src/lib/server/db-types.ts:85-92`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Produces: `fpvlovers_app.newsletter_subscribers.status`, `confirmed_at`, `consent_at`, `consent_version`, `consent_source`; `fpvlovers_app.users.terms_accepted_at`, `terms_version`, `age_attested_at`; `fpvlovers_app.consent_records` table.
- Produces: `NewsletterSubscriberRow` alanları `status: 'pending' | 'active' | 'unsubscribed'`, `confirmed_at: Date | null`, `consent_at: Date | null`, `consent_version: string | null`, `consent_source: string | null`.

- [ ] **Step 1: Pre-flight impact**

```bash
node .gitnexus/run.cjs impact "NewsletterSubscriberRow" --direction upstream --repo .
```

Beklenen: tipin tüketicileri listelenir. `risk: UNKNOWN` ise `rg -n "NewsletterSubscriberRow" src` ile doğrula.

- [ ] **Step 2: Write the failing test**

`scripts/privacy-compliance-regression-test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — `ENOENT` for migration and missing type fields.

- [ ] **Step 4: Write the migration**

`db/migrations/0011_privacy_compliance_foundation.sql`:

```sql
-- Migration: 0011_privacy_compliance_foundation
-- Purpose: P0 KVKK/GDPR data model for newsletter consent, account acceptance and cookie consent.

ALTER TABLE fpvlovers_app.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_source TEXT;

UPDATE fpvlovers_app.newsletter_subscribers
SET status = CASE WHEN is_active THEN 'active' ELSE 'unsubscribed' END
WHERE status IS NULL OR status = 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_status_check'
  ) THEN
    ALTER TABLE fpvlovers_app.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_status_check
      CHECK (status IN ('pending', 'active', 'unsubscribed'));
  END IF;
END $$;

ALTER TABLE fpvlovers_app.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS age_attested_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS fpvlovers_app.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id TEXT NOT NULL UNIQUE,
  categories JSONB NOT NULL,
  policy_version TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_created_at
  ON fpvlovers_app.consent_records (created_at DESC);
```

> Not: Mevcut `is_active = true` satırların `consent_at` değeri `NULL` kalır. Gönderim sorgusu `consent_at IS NOT NULL` istediği için eski liste, yeniden onay alınmadan otomatik gönderime girmez. Bu bilinçli bir güvenlik tercihidir.

- [ ] **Step 5: Update the row type**

`src/lib/server/db-types.ts` içindeki `NewsletterSubscriberRow`:

```ts
export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  source: string;
  status: 'pending' | 'active' | 'unsubscribed';
  confirmed_at: Date | null;
  consent_at: Date | null;
  consent_version: string | null;
  consent_source: string | null;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (2 checks).

- [ ] **Step 7: Commit**

```bash
git add db/migrations/0011_privacy_compliance_foundation.sql src/lib/server/db-types.ts scripts/privacy-compliance-regression-test.ts
git commit -m "feat(privacy): add consent and newsletter compliance data model"
```

---

## Task 2: İmzalı token'lar ve bülten mesajları

**Files:**
- Create: `src/lib/newsletter/tokens.ts`
- Create: `src/lib/newsletter/messages.ts`
- Modify: `src/lib/server/mailer.ts:18-43`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Produces: `signConfirmToken(subscriberId: string, expiresAt: number): string`
- Produces: `verifyConfirmToken(subscriberId: string, token: string, now?: number): boolean`
- Produces: `signUnsubscribeToken(subscriberId: string): string`
- Produces: `verifyUnsubscribeToken(subscriberId: string, token: string): boolean`
- Produces: `buildConfirmUrl(baseUrl: string, subscriberId: string, expiresAt: number, locale: 'tr' | 'en'): string`
- Produces: `buildUnsubscribeUrl(baseUrl: string, subscriberId: string): string`
- Produces: `buildListUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string>`
- Produces: `buildConfirmationEmail(input: { baseUrl: string; subscriberId: string; locale: 'tr' | 'en' }): { subject: string; html: string; text: string }`
- Produces: `appendUnsubscribeFooter(html: string, unsubscribeUrl: string, locale: 'tr' | 'en'): string`
- Produces: `sendEmail` accepts `headers?: Record<string, string>`.

- [ ] **Step 1: Append failing tests**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement token signing**

`src/lib/newsletter/tokens.ts`:

```ts
import crypto from 'node:crypto';

const DEV_SECRET = 'fpvlovers-newsletter-dev-secret-change-before-production';

function getSecret(): string {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEWSLETTER_TOKEN_SECRET or AUTH_SECRET must be configured in production.');
  }
  return DEV_SECRET;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signUnsubscribeToken(subscriberId: string): string {
  return sign(`unsubscribe:${subscriberId}`);
}

export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  return safeEqual(signUnsubscribeToken(subscriberId), token);
}

export function signConfirmToken(subscriberId: string, expiresAt: number): string {
  return `${expiresAt}.${sign(`confirm:${subscriberId}:${expiresAt}`)}`;
}

export function verifyConfirmToken(subscriberId: string, token: string, now = Date.now()): boolean {
  const separator = token.indexOf('.');
  if (separator < 1) return false;
  const expiresAt = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  return safeEqual(sign(`confirm:${subscriberId}:${expiresAt}`), signature);
}
```

- [ ] **Step 4: Implement message builders**

`src/lib/newsletter/messages.ts`:

```ts
import { signConfirmToken, signUnsubscribeToken } from './tokens';

export const NEWSLETTER_CONSENT_VERSION = '2026-10-31';

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function buildConfirmUrl(
  baseUrl: string,
  subscriberId: string,
  expiresAt: number,
  locale: 'tr' | 'en',
): string {
  const token = signConfirmToken(subscriberId, expiresAt);
  return `${trimBase(baseUrl)}/api/newsletter/confirm?id=${encodeURIComponent(subscriberId)}&token=${encodeURIComponent(token)}&lang=${locale}`;
}

export function buildUnsubscribeUrl(baseUrl: string, subscriberId: string): string {
  const token = signUnsubscribeToken(subscriberId);
  return `${trimBase(baseUrl)}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}&token=${encodeURIComponent(token)}`;
}

export function buildListUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

export function buildConfirmationEmail({
  baseUrl,
  subscriberId,
  locale,
}: {
  baseUrl: string;
  subscriberId: string;
  locale: 'tr' | 'en';
}): { subject: string; html: string; text: string } {
  const confirmUrl = buildConfirmUrl(baseUrl, subscriberId, Date.now() + 7 * 24 * 60 * 60 * 1000, locale);
  if (locale === 'en') {
    return {
      subject: 'Confirm your FPVLovers newsletter subscription',
      html: `<p>Please confirm your FPVLovers newsletter subscription.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, ignore this email.</p>`,
      text: `Confirm your FPVLovers newsletter subscription: ${confirmUrl}`,
    };
  }
  return {
    subject: 'FPVLovers bülten aboneliğinizi onaylayın',
    html: `<p>FPVLovers bülten aboneliğinizi onaylamak için aşağıdaki bağlantıya tıklayın.</p><p><a href="${confirmUrl}">Aboneliği onayla</a></p><p>Bu isteği siz yapmadıysanız e-postayı yok sayın.</p>`,
    text: `FPVLovers bülten aboneliğinizi onaylayın: ${confirmUrl}`,
  };
}

export function appendUnsubscribeFooter(
  html: string,
  unsubscribeUrl: string,
  locale: 'tr' | 'en',
): string {
  const label = locale === 'en' ? 'Unsubscribe' : 'Abonelikten çık';
  const note = locale === 'en'
    ? 'You are receiving this email because you confirmed a subscription.'
    : 'Bu e-postayı aboneliğinizi onayladığınız için alıyorsunuz.';
  return `${html}\n<hr /><p style="font-size:12px;color:#666">${note} <a href="${unsubscribeUrl}">${label}</a></p>`;
}
```

- [ ] **Step 5: Extend the mailer**

`src/lib/server/mailer.ts` içindeki imza ve `sendMail` çağrısı:

```ts
export async function sendEmail({
  to,
  subject,
  html,
  text,
  headers,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}) {
  try {
    const info = await transporter.sendMail({
      from: `FPV Lovers <${process.env.SMTP_FROM_EMAIL || 'newsletter@fpvlovers.com.tr'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      headers,
    });
    console.log(`[Mailer] Message sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mailer] Error sending email:`, error);
    return { success: false, error };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (6 checks).

- [ ] **Step 7: Commit**

```bash
git add src/lib/newsletter/tokens.ts src/lib/newsletter/messages.ts src/lib/server/mailer.ts scripts/privacy-compliance-regression-test.ts
git commit -m "feat(newsletter): add signed tokens and consent-aware messages"
```

---

## Task 3: Bülten API'leri ve alıcı başına gönderim

**Files:**
- Modify: `src/app/api/newsletter/subscribe/route.ts`
- Create: `src/app/api/newsletter/confirm/route.ts`
- Create: `src/app/api/newsletter/unsubscribe/route.ts`
- Modify: `src/lib/server/newsletter-orchestrator.ts:58-115`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Consumes: Task 1 columns; Task 2 `buildConfirmationEmail`, `buildUnsubscribeUrl`, `buildListUnsubscribeHeaders`, `appendUnsubscribeFooter`, `NEWSLETTER_CONSENT_VERSION`.
- Produces: `POST /api/newsletter/subscribe` returns `202` with `{ message: 'If this address can be subscribed, a confirmation email has been sent.', status: 'pending' }`.
- Produces: `GET /api/newsletter/confirm?id&token&lang` activates the subscriber.
- Produces: `GET|POST /api/newsletter/unsubscribe?id&token` deactivates the subscriber.

- [ ] **Step 1: Pre-flight impact**

```bash
node .gitnexus/run.cjs impact "dispatchCampaign" --direction upstream --repo .
node .gitnexus/run.cjs impact "sendEmail" --direction upstream --repo .
```

- [ ] **Step 2: Append failing tests**

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — subscription still allows no consent and dispatch joins recipients.

- [ ] **Step 4: Rewrite the subscribe route**

`src/app/api/newsletter/subscribe/route.ts`:

```ts
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';
import { sendEmail } from '@/lib/server/mailer';
import { buildConfirmationEmail, NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter/messages';

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  source: z.string().max(100).optional().default('footer_form'),
  consent: z.literal(true),
  locale: z.enum(['tr', 'en']).optional().default('tr'),
});

const GENERIC_MESSAGE = 'If this address can be subscribed, a confirmation email has been sent.';

export async function POST(request: NextRequest) {
  const limitRes = rateLimit(request, 5, 60 * 1000, 'newsletter-subscribe');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'X-RateLimit-Limit': String(limitRes.limit), 'X-RateLimit-Remaining': String(limitRes.remaining), 'X-RateLimit-Reset': String(limitRes.reset) } },
    );
  }

  try {
    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid submission data.', details: parsed.error.format() }, { status: 400 });
    }

    const { email, source, locale } = parsed.data;
    const existing = await query<{ id: string; status: string }>(
      'SELECT id, status FROM fpvlovers_app.newsletter_subscribers WHERE email = $1',
      [email],
    );

    if (existing.rows[0]?.status === 'active') {
      return NextResponse.json({ message: GENERIC_MESSAGE, status: 'pending' }, { status: 202 });
    }

    const subscriberId = existing.rows[0]?.id ?? crypto.randomUUID();

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO fpvlovers_app.newsletter_subscribers
           (id, email, source, is_active, status, consent_version, consent_source)
         VALUES ($1, $2, $3, false, 'pending', $4, $5)`,
        [subscriberId, email, source, NEWSLETTER_CONSENT_VERSION, source],
      );
    } else {
      await query(
        `UPDATE fpvlovers_app.newsletter_subscribers
         SET status = 'pending', is_active = false, unsubscribed_at = NULL,
             consent_version = $2, consent_source = $3
         WHERE id = $1`,
        [subscriberId, NEWSLETTER_CONSENT_VERSION, source],
      );
    }

    const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
    const confirmation = buildConfirmationEmail({ baseUrl, subscriberId, locale });
    await sendEmail({ to: email, ...confirmation });

    return NextResponse.json({ message: GENERIC_MESSAGE, status: 'pending' }, { status: 202 });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong while subscribing.' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Add the confirm route**

`src/app/api/newsletter/confirm/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { verifyConfirmToken } from '@/lib/newsletter/tokens';

function page(status: number, title: string, message: string): Response {
  return new Response(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="background:#050810;color:#e5e7eb;font-family:system-ui;padding:48px;text-align:center"><h1>${title}</h1><p>${message}</p><p><a style="color:#ff5c00" href="/">FPVLovers</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'tr';

  if (!id || !token || !verifyConfirmToken(id, token)) {
    return page(400, lang === 'en' ? 'Invalid link' : 'Geçersiz bağlantı', lang === 'en' ? 'This confirmation link is invalid or expired.' : 'Bu onay bağlantısı geçersiz veya süresi dolmuş.');
  }

  const result = await query(
    `UPDATE fpvlovers_app.newsletter_subscribers
     SET status = 'active', is_active = true, confirmed_at = NOW(), consent_at = NOW(), unsubscribed_at = NULL
     WHERE id = $1
     RETURNING id`,
    [id],
  );

  if (result.rowCount === 0) {
    return page(404, lang === 'en' ? 'Subscription not found' : 'Abonelik bulunamadı', lang === 'en' ? 'This subscription no longer exists.' : 'Bu abonelik artık mevcut değil.');
  }

  return page(200, lang === 'en' ? 'Subscription confirmed' : 'Abonelik onaylandı', lang === 'en' ? 'You will receive the FPVLovers newsletter. You can unsubscribe from any email.' : 'FPVLovers bültenini alacaksınız. Her e-postadan abonelikten çıkabilirsiniz.');
}
```

- [ ] **Step 6: Add the unsubscribe route**

`src/app/api/newsletter/unsubscribe/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { verifyUnsubscribeToken } from '@/lib/newsletter/tokens';

function page(status: number, title: string, message: string): Response {
  return new Response(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="background:#050810;color:#e5e7eb;font-family:system-ui;padding:48px;text-align:center"><h1>${title}</h1><p>${message}</p><p><a style="color:#ff5c00" href="/">FPVLovers</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function unsubscribe(request: NextRequest): Promise<Response> {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';

  if (!id || !token || !verifyUnsubscribeToken(id, token)) {
    return page(400, 'Geçersiz bağlantı', 'Bu abonelik iptali bağlantısı geçersiz.');
  }

  await query(
    `UPDATE fpvlovers_app.newsletter_subscribers
     SET status = 'unsubscribed', is_active = false, unsubscribed_at = NOW()
     WHERE id = $1`,
    [id],
  );

  return page(200, 'Abonelikten çıkıldı', 'Artık FPVLovers bülteni almayacaksınız.');
}

export async function GET(request: NextRequest) {
  return unsubscribe(request);
}

export async function POST(request: NextRequest) {
  return unsubscribe(request);
}
```

- [ ] **Step 7: Rewrite dispatch**

`src/lib/server/newsletter-orchestrator.ts` içindeki `dispatchCampaign` gövdesini şu blokla değiştir (2. adımdan itibaren):

```ts
      const subRes = await query<{ id: string; email: string }>(
        `SELECT id, email FROM fpvlovers_app.newsletter_subscribers
         WHERE is_active = true AND status = 'active' AND consent_at IS NOT NULL`
      );

      if (subRes.rows.length === 0) {
        console.log('[NewsletterOrchestrator] No consenting active subscribers found. Skipping dispatch.');
        return { success: true, sentCount: 0 };
      }

      console.log(`[NewsletterOrchestrator] Dispatching campaign "${campaign.subject}" to ${subRes.rows.length} subscribers...`);

      const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
      let sentCount = 0;
      let failureCount = 0;

      for (const subscriber of subRes.rows) {
        const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, subscriber.id);
        const emailResult = await sendEmail({
          to: subscriber.email,
          subject: campaign.subject,
          html: appendUnsubscribeFooter(campaign.content_html, unsubscribeUrl, 'tr'),
          text: campaign.content_md || undefined,
          headers: buildListUnsubscribeHeaders(unsubscribeUrl),
        });
        if (emailResult.success) sentCount += 1;
        else failureCount += 1;
      }

      if (sentCount === 0) {
        throw new Error('Mailer failed to send campaign emails.');
      }

      await query(
        `UPDATE fpvlovers_app.newsletter_campaigns
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP, recipient_count = $1
         WHERE id = $2`,
        [sentCount, campaignId]
      );

      console.log(`[NewsletterOrchestrator] Campaign sent to ${sentCount} subscribers (${failureCount} failures).`);
      return { success: true, sentCount };
```

Dosya başına import ekle:

```ts
import { appendUnsubscribeFooter, buildListUnsubscribeHeaders, buildUnsubscribeUrl } from '../newsletter/messages';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (8 checks).

- [ ] **Step 9: Commit**

```bash
git add src/app/api/newsletter/subscribe/route.ts src/app/api/newsletter/confirm/route.ts src/app/api/newsletter/unsubscribe/route.ts src/lib/server/newsletter-orchestrator.ts scripts/privacy-compliance-regression-test.ts
git commit -m "fix(newsletter): require double opt-in and send per-recipient unsubscribe links"
```

---

## Task 4: Çerez rızası, sunucu kaydı ve GA kapısı

**Files:**
- Create: `src/lib/consent/consent.ts`
- Create: `src/app/api/consent/route.ts`
- Create: `src/features/layout/components/ConsentProvider.tsx`
- Create: `src/features/layout/components/ConsentGatedAnalytics.tsx`
- Create: `src/features/layout/components/CookiePreferencesLink.tsx`
- Modify: `src/features/layout/components/CookieBanner.tsx`
- Modify: `src/features/layout/components/RootShell.tsx`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Produces: `CONSENT_COOKIE = 'fpv_consent'`, `CONSENT_VERSION = '2026-10-31'`
- Produces: `ConsentCategories`, `ConsentState`
- Produces: `createConsentState(categories: { analytics: boolean; marketing: boolean }, id?: string, decidedAt?: Date): ConsentState`
- Produces: `parseConsentCookie(raw: string | null | undefined): ConsentState | null`
- Produces: `serializeConsentCookie(state: ConsentState): string`
- Produces: `hasAnalyticsConsent(state: ConsentState | null): boolean`
- Produces: `useConsent(): { consent, ready, preferencesOpen, save, openPreferences, closePreferences }`
- Produces: `POST /api/consent` body `{ consentId, categories, policyVersion, source? }`.

- [ ] **Step 1: Append failing tests**

```ts
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  createConsentState,
  hasAnalyticsConsent,
  parseConsentCookie,
  serializeConsentCookie,
} from '../src/lib/consent/consent';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — consent module missing, GA unconditional.

- [ ] **Step 3: Implement the consent model**

`src/lib/consent/consent.ts`:

```ts
export const CONSENT_COOKIE = 'fpv_consent';
export const CONSENT_VERSION = '2026-10-31';

export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = {
  version: string;
  id: string;
  decidedAt: string;
  categories: ConsentCategories;
};

export function createConsentState(
  categories: { analytics: boolean; marketing: boolean },
  id: string = crypto.randomUUID(),
  decidedAt: Date = new Date(),
): ConsentState {
  return {
    version: CONSENT_VERSION,
    id,
    decidedAt: decidedAt.toISOString(),
    categories: { necessary: true, analytics: categories.analytics === true, marketing: categories.marketing === true },
  };
}

export function serializeConsentCookie(state: ConsentState): string {
  return JSON.stringify(state);
}

export function parseConsentCookie(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION || !parsed.categories) return null;
    return {
      version: CONSENT_VERSION,
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : 'unknown',
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : new Date().toISOString(),
      categories: {
        necessary: true,
        analytics: parsed.categories.analytics === true,
        marketing: parsed.categories.marketing === true,
      },
    };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(state: ConsentState | null): boolean {
  return state?.categories.analytics === true;
}

export function hasMarketingConsent(state: ConsentState | null): boolean {
  return state?.categories.marketing === true;
}
```

- [ ] **Step 4: Implement the consent API**

`src/app/api/consent/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/server/db';
import { CONSENT_VERSION } from '@/lib/consent/consent';

const schema = z.object({
  consentId: z.string().min(8).max(100),
  policyVersion: z.literal(CONSENT_VERSION),
  source: z.string().max(100).optional().default('banner'),
  categories: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid consent payload.' }, { status: 400 });
    }

    const { consentId, policyVersion, source, categories } = parsed.data;
    await query(
      `INSERT INTO fpvlovers_app.consent_records (consent_id, categories, policy_version, source)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT (consent_id) DO UPDATE
       SET categories = EXCLUDED.categories, policy_version = EXCLUDED.policy_version, source = EXCLUDED.source`,
      [consentId, JSON.stringify(categories), policyVersion, source],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Consent] Failed to record consent:', error);
    return NextResponse.json({ error: 'Consent could not be recorded.' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Implement the provider**

`src/features/layout/components/ConsentProvider.tsx`:

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  createConsentState,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentCategories,
  type ConsentState,
} from '@/lib/consent/consent';

type ConsentContextValue = {
  consent: ConsentState | null;
  ready: boolean;
  preferencesOpen: boolean;
  save: (categories: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readConsentCookie(): string | null {
  const prefix = `${CONSENT_COOKIE}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(parseConsentCookie(readConsentCookie()));
    setReady(true);
  }, []);

  const save = useCallback((categories: { analytics: boolean; marketing: boolean }) => {
    const state = createConsentState(categories);
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsentCookie(state))}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setConsent(state);
    setPreferencesOpen(false);
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentId: state.id,
        policyVersion: CONSENT_VERSION,
        source: 'banner',
        categories: state.categories,
      }),
    }).catch(() => undefined);
  }, []);

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    ready,
    preferencesOpen,
    save,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
  }), [consent, ready, preferencesOpen, save]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used inside ConsentProvider');
  return context;
}

export type { ConsentCategories };
```

- [ ] **Step 6: Implement the analytics gate**

`src/features/layout/components/ConsentGatedAnalytics.tsx`:

```tsx
'use client';

import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { useConsent } from './ConsentProvider';

export function ConsentGatedAnalytics({ gaId, vercelEnabled }: { gaId?: string; vercelEnabled?: boolean }) {
  const { consent, ready } = useConsent();
  if (!ready || !consent?.categories.analytics) return null;
  return (
    <>
      {vercelEnabled ? <Analytics /> : null}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}
```

- [ ] **Step 7: Implement the preferences link**

`src/features/layout/components/CookiePreferencesLink.tsx`:

```tsx
'use client';

import type { Locale } from '@/lib/i18n/locale';
import { useConsent } from './ConsentProvider';

export function CookiePreferencesLink({ locale }: { locale: Locale }) {
  const { openPreferences } = useConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
    >
      {locale === 'tr' ? 'Çerez Tercihleri' : 'Cookie Preferences'}
    </button>
  );
}
```

- [ ] **Step 8: Rewrite the banner**

`src/features/layout/components/CookieBanner.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { legalPath } from '@/lib/legal/paths';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';
import { useConsent } from './ConsentProvider';

const COPY = {
  en: {
    title: 'Cookie preferences',
    body: 'We use necessary cookies to run the site. Analytics cookies load only if you allow them.',
    accept: 'Accept all',
    reject: 'Reject non-essential',
    manage: 'Manage preferences',
    save: 'Save choices',
    necessary: 'Necessary',
    necessaryDesc: 'Required for sign-in, security and remembering this choice.',
    analytics: 'Analytics',
    analyticsDesc: 'Aggregated page and search metrics that help us improve the site.',
    marketing: 'Marketing',
    marketingDesc: 'Used only if we add advertising or affiliate tracking pixels. Currently off.',
    cookies: 'Cookie Policy',
  },
  tr: {
    title: 'Çerez tercihleri',
    body: 'Siteyi çalıştırmak için zorunlu çerezler kullanıyoruz. Analitik çerezler yalnızca izin verirseniz yüklenir.',
    accept: 'Tümünü kabul et',
    reject: 'Zorunlu olmayanları reddet',
    manage: 'Tercihleri yönet',
    save: 'Seçimleri kaydet',
    necessary: 'Zorunlu',
    necessaryDesc: 'Oturum, güvenlik ve bu tercihi hatırlamak için gereklidir.',
    analytics: 'Analitik',
    analyticsDesc: 'Siteyi geliştirmek için toplu sayfa ve arama metrikleri.',
    marketing: 'Pazarlama',
    marketingDesc: 'Yalnızca reklam veya affiliate izleme pikseli eklenirse kullanılır. Şu an kapalı.',
    cookies: 'Çerez Politikası',
  },
} as const;

export function CookieBanner({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { consent, ready, preferencesOpen, save, openPreferences, closePreferences } = useConsent();
  const copy = COPY[locale];
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (consent) {
      setAnalytics(consent.categories.analytics);
      setMarketing(consent.categories.marketing);
    }
  }, [consent, preferencesOpen]);

  if (!ready) return null;
  if (consent && !preferencesOpen) return null;

  const isPanel = preferencesOpen || Boolean(consent);
  const cookiePolicyHref = legalPath('cookies', locale);

  return (
    <div role={isPanel ? 'dialog' : 'region'} aria-label={copy.title} className="fixed inset-x-0 bottom-16 z-40 border-t border-white/10 bg-[#050810]/95 backdrop-blur-md lg:bottom-0">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-200">{copy.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-zinc-400">
              {copy.body}{' '}
              <Link href={cookiePolicyHref} className="text-[#ff8a8d] hover:underline">{copy.cookies}</Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              {copy.reject}
            </button>
            <Button variant="amber" size="sm" onClick={() => save({ analytics: true, marketing: true })} className="min-h-9 px-4 font-mono text-[10px] font-black uppercase">
              {copy.accept}
            </Button>
            <button type="button" onClick={openPreferences} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              {copy.manage}
            </button>
          </div>
        </div>

        {preferencesOpen && (
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            <label className="flex items-start gap-3 text-[11px] text-zinc-300">
              <input type="checkbox" checked disabled className="mt-0.5" />
              <span><strong className="text-zinc-100">{copy.necessary}</strong> — {copy.necessaryDesc}</span>
            </label>
            <label className="flex items-start gap-3 text-[11px] text-zinc-300">
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-0.5" />
              <span><strong className="text-zinc-100">{copy.analytics}</strong> — {copy.analyticsDesc}</span>
            </label>
            <label className="flex items-start gap-3 text-[11px] text-zinc-300">
              <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="mt-0.5" />
              <span><strong className="text-zinc-100">{copy.marketing}</strong> — {copy.marketingDesc}</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="amber" size="sm" onClick={() => save({ analytics, marketing })} className="min-h-9 px-4 font-mono text-[10px] font-black uppercase">
                {copy.save}
              </Button>
              <button type="button" onClick={closePreferences} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {locale === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Wire the shell**

`src/features/layout/components/RootShell.tsx` — `Analytics` ve `GoogleAnalytics` importlarını kaldır; `ConsentProvider`, `ConsentGatedAnalytics` ekle; gövdeyi şu yapıya çevir:

```tsx
import { SessionProvider } from 'next-auth/react';
import type { Locale } from '@/lib/i18n/locale';
import { SITE_JSON_LD } from '@/lib/seo/root-metadata';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';
import { MobileUtilityBar } from './MobileUtilityBar';
import { CookieBanner } from './CookieBanner';
import { ConsentProvider } from './ConsentProvider';
import { ConsentGatedAnalytics } from './ConsentGatedAnalytics';

export function RootShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const enableVercelAnalytics = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true';

  return (
    <html lang={lang} className="dark">
      <body className="font-sans min-h-screen antialiased selection:bg-[#ff5a1f]/30 selection:text-white relative" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <SessionProvider>
          <ConsentProvider>
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute inset-0 carbon-grid opacity-35" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/45 to-transparent" />
            </div>

            <Navbar locale={lang} />
            <main className="relative z-10 pb-16 lg:pb-0">{children}</main>
            <MobileUtilityBar locale={lang} />
            <CookieBanner locale={lang} />
            <SiteFooter locale={lang} />
            <ConsentGatedAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} vercelEnabled={enableVercelAnalytics} />
          </ConsentProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (11 checks).

- [ ] **Step 11: Commit**

```bash
git add src/lib/consent/consent.ts src/app/api/consent/route.ts src/features/layout/components/ConsentProvider.tsx src/features/layout/components/ConsentGatedAnalytics.tsx src/features/layout/components/CookiePreferencesLink.tsx src/features/layout/components/CookieBanner.tsx src/features/layout/components/RootShell.tsx scripts/privacy-compliance-regression-test.ts
git commit -m "feat(privacy): gate analytics behind recorded cookie consent"
```

---

## Task 5: Hukuki belgeler, controller bloğu ve TR/EN sayfalar

**Files:**
- Create: `src/lib/legal/version.ts`
- Create: `src/lib/legal/controller.ts`
- Create: `src/lib/legal/paths.ts`
- Create: `src/lib/legal/documents.ts`
- Create: `src/lib/legal/metadata.ts`
- Create: `src/features/legal/components/LegalDocumentPage.tsx`
- Create: `src/features/legal/components/LegalConfigurationNotice.tsx`
- Create: `src/app/tr/kvkk-aydinlatma/page.tsx`
- Create: `src/app/tr/gizlilik-politikasi/page.tsx`
- Create: `src/app/tr/cerez-politikasi/page.tsx`
- Create: `src/app/tr/kullanim-kosullari/page.tsx`
- Create: `src/app/(en)/cookie-policy/page.tsx`
- Modify: `src/app/(en)/privacy/page.tsx` (complete rewrite)
- Modify: `src/app/(en)/terms/page.tsx` (complete rewrite)
- Modify: `src/features/layout/components/SiteFooter.tsx:14-40,157-177`
- Modify: `src/app/sitemap.xml/route.ts`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Produces: `LEGAL_DOCUMENT_VERSION = '2026-10-31'`
- Produces: `LegalDocumentKey = 'privacy' | 'cookies' | 'terms' | 'kvkk'`
- Produces: `LegalController`, `getLegalController()`, `isLegalControllerConfigured(controller)`
- Produces: `legalPath(key, locale)`, `LEGAL_PATHS`, `LEGAL_PAGE_PAIRS`
- Produces: `buildLegalDocuments(controller): { tr: ..., en: ... }`, `getLegalDocument(locale, key, controller)`
- Produces: `legalMetadata({ title, description, canonicalPath, languages? }): Metadata`

- [ ] **Step 1: Append failing tests**

```ts
import { LEGAL_DOCUMENT_VERSION } from '../src/lib/legal/version';
import { isLegalControllerConfigured, type LegalController } from '../src/lib/legal/controller';
import { LEGAL_PAGE_PAIRS, legalPath } from '../src/lib/legal/paths';
import { buildLegalDocuments } from '../src/lib/legal/documents';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — legal modules and pages missing.

- [ ] **Step 3: Create version, controller and paths**

`src/lib/legal/version.ts`:

```ts
export const LEGAL_DOCUMENT_VERSION = '2026-10-31';
```

`src/lib/legal/controller.ts`:

```ts
export type LegalController = {
  name: string;
  address: string;
  email: string;
  kep?: string;
  taxId?: string;
};

export function getLegalController(): LegalController {
  return {
    name: process.env.LEGAL_CONTROLLER_NAME?.trim() || '',
    address: process.env.LEGAL_CONTROLLER_ADDRESS?.trim() || '',
    email: process.env.LEGAL_CONTROLLER_EMAIL?.trim() || 'hello@fpvlovers.com.tr',
    kep: process.env.LEGAL_CONTROLLER_KEP?.trim() || undefined,
    taxId: process.env.LEGAL_CONTROLLER_TAX_ID?.trim() || undefined,
  };
}

export function isLegalControllerConfigured(controller: LegalController): boolean {
  return Boolean(controller.name && controller.address && controller.email);
}
```

`src/lib/legal/paths.ts`:

```ts
import type { Locale } from '@/lib/i18n/locale';

export type LegalDocumentKey = 'privacy' | 'cookies' | 'terms' | 'kvkk';

export const LEGAL_PATHS = {
  en: {
    privacy: '/privacy',
    cookies: '/cookie-policy',
    terms: '/terms',
  },
  tr: {
    privacy: '/tr/gizlilik-politikasi',
    cookies: '/tr/cerez-politikasi',
    terms: '/tr/kullanim-kosullari',
    kvkk: '/tr/kvkk-aydinlatma',
  },
} as const;

export const LEGAL_PAGE_PAIRS = [
  { en: LEGAL_PATHS.en.privacy, tr: LEGAL_PATHS.tr.privacy },
  { en: LEGAL_PATHS.en.cookies, tr: LEGAL_PATHS.tr.cookies },
  { en: LEGAL_PATHS.en.terms, tr: LEGAL_PATHS.tr.terms },
] as const;

export function legalPath(key: LegalDocumentKey, locale: Locale): string {
  if (locale === 'tr') return LEGAL_PATHS.tr[key];
  if (key === 'kvkk') return LEGAL_PATHS.en.privacy;
  return LEGAL_PATHS.en[key];
}
```

- [ ] **Step 4: Create the documents module**

`src/lib/legal/documents.ts` (tam içerik):

```ts
import type { LegalController } from './controller';
import { LEGAL_DOCUMENT_VERSION } from './version';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  key: 'privacy' | 'cookies' | 'terms' | 'kvkk';
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export type LocaleLegalDocuments = {
  privacy: LegalDocument;
  cookies: LegalDocument;
  terms: LegalDocument;
  kvkk?: LegalDocument;
};

function controllerLine(controller: LegalController, locale: 'tr' | 'en'): string {
  const parts = [
    controller.name,
    controller.address,
    controller.email,
    controller.kep ? `KEP: ${controller.kep}` : '',
    controller.taxId ? `${locale === 'tr' ? 'Vergi No' : 'Tax ID'}: ${controller.taxId}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function buildLegalDocuments(controller: LegalController): { tr: LocaleLegalDocuments; en: LocaleLegalDocuments } {
  return {
    tr: {
      kvkk: {
        key: 'kvkk',
        title: 'KVKK Aydınlatma Metni',
        description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım ve haklarınıza ilişkin aydınlatma metni.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Veri Sorumlusu',
            paragraphs: [
              `Veri sorumlusu: ${controllerLine(controller, 'tr')}.`,
              'Bu metin, fpvlovers.com.tr üzerinden kişisel veri toplanan tüm kullanıcılar için geçerlidir.',
            ],
          },
          {
            heading: '2. İşlenen Kişisel Veriler',
            paragraphs: ['Hizmetin niteliğine göre aşağıdaki veriler işlenebilir:'],
            bullets: [
              'Bülten: e-posta adresi, abonelik kaynağı, onay zamanı ve onay metni sürümü.',
              'İletişim: ad, e-posta adresi, talep türü ve mesaj içeriği.',
              'Hesap: ad, e-posta adresi, parola özeti, sağlayıcı kimliği (Google/Discord/GitHub ile giriş), hesap ilerlemesi.',
              'Teknik: IP adresi (yalnızca hız sınırlama için geçici), tarayıcı/cihaz bilgisi, erişim zamanı ve hata kayıtları.',
              'Analitik: sayfa ve içerik tanımlayıcıları, arama olayının uzunluğu ve sonuç sayısı; kimlik oluşturmayan toplu olay kayıtları.',
              'Çerez tercihi: zorunlu, analitik ve pazarlama kategorileri ile tercih zamanı.',
            ],
          },
          {
            heading: '3. İşleme Amaçları',
            paragraphs: ['Kişisel veriler aşağıdaki amaçlarla işlenir:'],
            bullets: [
              'Bülten aboneliğinin kurulması, onaylanması ve yönetilmesi.',
              'İletişim taleplerinin yanıtlanması ve içerik düzeltmelerinin incelenmesi.',
              'Hesap oluşturulması, oturum güvenliği ve pilot ilerlemesinin saklanması.',
              'Site güvenliği, kötüye kullanımın önlenmesi ve hata ayıklama.',
              'Toplu analitik ile içerik ve kullanıcı deneyiminin iyileştirilmesi.',
              'Hukuki yükümlülüklerin yerine getirilmesi ve yetkili kurumlara bilgi verilmesi.',
            ],
          },
          {
            heading: '4. Hukuki Sebepler',
            paragraphs: [
              'Veriler, KVKK m.5/2 uyarınca sözleşmenin kurulması veya ifası (hesap ve bülten), hukuki yükümlülük (saklama ve yetkili kurum talepleri), bir hakkın tesisi/kullanılması/korunması ve meşru menfaat (güvenlik, hata ayıklama, toplu analitik) sebeplerine dayanılarak işlenir.',
              'Bülten, ticari elektronik ileti ve zorunlu olmayan çerezler için açık rızanız alınır. Açık rıza, onay kutusu işaretlenerek ve çift onay e-postası ile teyit edilerek kaydedilir. Rızanızı dilediğiniz zaman geri çekebilirsiniz; geri çekme, geri çekmeden önceki işlemlerin hukukiliğini etkilemez.',
            ],
          },
          {
            heading: '5. Toplama Yöntemi',
            paragraphs: [
              'Veriler; web formları, çerezler, oturum açma sağlayıcıları, sunucu günlükleri ve e-posta etkileşimleri aracılığıyla elektronik ortamda toplanır. Zorunlu alanlar form üzerinde belirtilir; zorunlu olmayan alanların doldurulması isteğe bağlıdır.',
            ],
          },
          {
            heading: '6. Alıcılar ve Yurt Dışına Aktarım',
            paragraphs: [
              'Veriler; barındırma ve veritabanı hizmeti, e-posta gönderim hizmeti, yapay zekâ/arama altyapısı, analitik hizmeti ve tıkladığınızda yönlendirildiğiniz satıcılar ile paylaşılabilir. Yetkili kamu kurumlarına hukuki talep halinde bilgi verilebilir.',
              'Barındırma ve yapay zekâ/e-posta hizmetlerinin bir kısmı Türkiye dışında yerleşik olabilir. Yurt dışına aktarım, KVKK m.9 kapsamında uygun güvenceye veya açık rızanıza dayanır. Aktarımın hukuki sebebi ve alıcı kategorileri bu metinde ve Çerez Politikası’nda açıklanır.',
              'Affiliate bağlantılarına tıkladığınızda satıcının kendi sitesine gidersiniz; o sitedeki veri işleme faaliyetlerinden satıcı sorumludur.',
            ],
          },
          {
            heading: '7. Saklama Süreleri',
            paragraphs: ['Veriler, amaç için gerekli süre ve mevzuattaki zamanaşımı süreleri boyunca saklanır:'],
            bullets: [
              'Bülten: onaylı abonelik aktif olduğu sürece; abonelikten çıkma sonrası ispat amacıyla en fazla 2 yıl.',
              'Onaylanmamış abonelik: 30 gün.',
              'İletişim talepleri: yanıtın tamamlanmasından sonra en fazla 1 yıl.',
              'Hesap ve ilerleme: hesap silinene kadar; silme talebinden sonra yedeklerde en fazla 30 gün.',
              'Analitik olayları: en fazla 180 gün; toplu özetler kişisel veri içermeyecek şekilde daha uzun süre saklanabilir.',
              'Çerez rıza kayıtları: rızanın ispatı için en fazla 5 yıl.',
            ],
          },
          {
            heading: '8. Veri Güvenliği',
            paragraphs: [
              'TLS ile şifreli iletişim, parola özetleme, erişim kontrolü, hız sınırlama, güvenli yapılandırma ve düzenli yedekleme uygulanır. Veri ihlali tespit edilirse ilgili kişiler ve yetkili makamlar mevzuatta öngörülen sürelerde bilgilendirilir.',
            ],
          },
          {
            heading: '9. Haklarınız',
            paragraphs: ['KVKK m.11 uyarınca:'],
            bullets: [
              'Kişisel verilerinizin işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme.',
              'İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.',
              'Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri öğrenme.',
              'Eksik veya yanlış işlenen verilerin düzeltilmesini isteme.',
              'KVKK m.7’deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme.',
              'Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme.',
              'Münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.',
              'Kanuna aykırı işleme nedeniyle zarara uğramanız halinde giderilmesini talep etme.',
            ],
          },
          {
            heading: '10. Başvuru',
            paragraphs: [
              `Taleplerinizi ${controller.email} adresine veya yazılı olarak ${controller.address} adresine iletebilirsiniz. Başvuruda adınız, iletişim bilginiz ve talebinizin açıkça belirtilmesi gerekir. Talepler en geç 30 gün içinde ücretsiz olarak yanıtlanır; işlemin ayrıca maliyet gerektirmesi halinde Kurul tarifesindeki ücret alınabilir.`,
            ],
          },
          {
            heading: '11. Değişiklikler',
            paragraphs: [
              `Bu metin ${LEGAL_DOCUMENT_VERSION} tarihinde güncellenmiştir. Önemli değişiklikler sitede duyurulur; yürürlük tarihinden sonra hizmeti kullanmaya devam etmeniz güncel metni kabul ettiğiniz anlamına gelmez, gerekli hallerde yeniden onay alınır.`,
            ],
          },
        ],
      },
      privacy: {
        key: 'privacy',
        title: 'Gizlilik Politikası',
        description: 'FPVLovers’ın kişisel verileri nasıl topladığı, kullandığı, sakladığı ve koruduğuna ilişkin genel gizlilik politikası.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Kapsam',
            paragraphs: [
              'Bu politika fpvlovers.com.tr ve alt alan adlarında işlenen kişisel verileri kapsar. Türkiye’deki kullanıcılar için KVKK Aydınlatma Metni, Avrupa Birliği/AEA’daki kullanıcılar için GDPR kapsamındaki haklar, Kaliforniya’daki kullanıcılar için CCPA/CPRA kapsamındaki şeffaflık yükümlülükleri geçerlidir.',
            ],
          },
          {
            heading: '2. Topladığımız Veriler',
            paragraphs: ['Hizmete göre şu verileri toplarız:'],
            bullets: [
              'Bülten: e-posta adresi, onay zamanı ve kaynağı.',
              'İletişim: ad, e-posta, talep türü, mesaj.',
              'Hesap: ad, e-posta, parola özeti, OAuth sağlayıcı bilgisi, ilerleme.',
              'Analitik: sayfa/içerik tanımlayıcıları, arama olayı uzunluğu ve sonuç sayısı, cihaz/tarayıcı türü.',
              'Çerez tercihleri ve teknik güvenlik kayıtları.',
            ],
          },
          {
            heading: '3. Kullanım Amaçları',
            paragraphs: [
              'Verileri bülteni göndermek, talepleri yanıtlamak, hesabı ve ilerlemeyi yönetmek, site güvenliğini sağlamak, toplu analitikle içeriği iyileştirmek ve hukuki yükümlülükleri yerine getirmek için kullanırız. Verilerinizi satmayız.',
            ],
          },
          {
            heading: '4. Hukuki Sebepler',
            paragraphs: [
              'Türkiye’de KVKK m.5/2; AB’de GDPR m.6 (sözleşme, hukuki yükümlülük, meşru menfaat, açık rıza). Bülten ve zorunlu olmayan çerezler için açık rıza alınır; rıza her zaman geri çekilebilir.',
            ],
          },
          {
            heading: '5. Paylaşım ve Yurt Dışına Aktarım',
            paragraphs: [
              'Barındırma, e-posta gönderimi, yapay zekâ/arama altyapısı ve analitik hizmet sağlayıcılarıyla veri paylaşabiliriz. Bu sağlayıcılar Türkiye dışında yerleşik olabilir. Aktarımlar KVKK m.9 ve GDPR m.44+ kapsamında uygun güvencelere veya açık rızaya dayanır. Affiliate satıcılarına tıklama sonrası o sitenin gizlilik politikası geçerlidir.',
            ],
          },
          {
            heading: '6. Saklama ve Güvenlik',
            paragraphs: [
              'Veriler amaç için gerekli süre boyunca saklanır; bülten onayı abonelik boyunca ve ispat için en fazla 2 yıl, analitik olayları en fazla 180 gün, iletişim talepleri en fazla 1 yıl tutulur. TLS, erişim kontrolü, parola özetleme ve yedekleme uygularız.',
            ],
          },
          {
            heading: '7. Haklarınız',
            paragraphs: [
              'KVKK m.11 ve GDPR m.15–22 kapsamında erişim, düzeltme, silme, kısıtlama, taşınabilirlik, itiraz ve rıza geri çekme haklarınız vardır. Hesap menüsünden verilerinizi indirebilir veya hesabınızı silebilirsiniz; ayrıca hello@fpvlovers.com.tr adresine başvurabilirsiniz.',
            ],
          },
          {
            heading: '8. Çocuklar',
            paragraphs: [
              'Hizmet 13 yaşından küçük çocuklara yönelik değildir. 13–16 yaş arası kullanıcılar için yerel mevzuatın gerektirdiği hallerde ebeveyn onayı gerekir.',
            ],
          },
          {
            heading: '9. AB ve ABD Kullanıcıları',
            paragraphs: [
              'AB/AEA kullanıcıları GDPR kapsamındaki haklarını kullanabilir. Kaliforniya kullanıcıları için: kişisel bilgileri satmıyoruz; CCPA/CPRA kapsamındaki erişim, silme ve ayrımcılık görmeme hakları geçerlidir.',
            ],
          },
          {
            heading: '10. İletişim',
            paragraphs: [`Sorularınız için ${controller.email} adresine yazabilirsiniz. Veri sorumlusu: ${controllerLine(controller, 'tr')}.`],
          },
        ],
      },
      cookies: {
        key: 'cookies',
        title: 'Çerez Politikası',
        description: 'FPVLovers’ta kullanılan çerezler, amaçları, süreleri ve tercihlerinizi nasıl yöneteceğiniz.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Çerez Nedir?',
            paragraphs: [
              'Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Oturumun sürdürülmesi, güvenlik ve tercihlerin hatırlanması için kullanılır. Zorunlu olmayan çerezler yalnızca açık rızanızla yüklenir.',
            ],
          },
          {
            heading: '2. Kategoriler',
            paragraphs: ['Çerezleri üç kategoride değerlendiririz:'],
            bullets: [
              'Zorunlu: oturum açma, CSRF koruması ve çerez tercihinin hatırlanması.',
              'Analitik: sayfa görüntüleme ve arama metrikleri; yalnızca rıza ile.',
              'Pazarlama: reklam veya affiliate izleme pikseli; şu an kullanılmıyor, eklenirse yalnızca rıza ile.',
            ],
          },
          {
            heading: '3. Çerez Tablosu',
            paragraphs: ['Başlıca çerezler:'],
            bullets: [
              'authjs.session-token — zorunlu — oturum — oturum süresi.',
              'authjs.csrf-token — zorunlu — CSRF koruması — oturum süresi.',
              'fpv_consent — zorunlu — çerez tercihi — 1 yıl.',
              '_ga, _ga_* — analitik — Google Analytics — yalnızca rıza ile, en fazla 2 yıl.',
              'Satıcı çerezleri — pazarlama — affiliate satıcısının alan adında, tıklama sonrası — satıcının politikası.',
            ],
          },
          {
            heading: '4. Tercihlerinizi Yönetme',
            paragraphs: [
              'Site altındaki “Çerez Tercihleri” bağlantısından kategorileri değiştirebilirsiniz. Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezlerin engellenmesi oturum açma gibi işlevleri bozabilir.',
            ],
          },
          {
            heading: '5. Üçüncü Taraf Çerezleri',
            paragraphs: [
              'Affiliate bağlantılarına tıkladığınızda satıcının sitesine gidersiniz; o sitede satıcının çerezleri ve gizlilik politikası geçerlidir. Sitede üçüncü taraf reklam pikseli kullanmıyoruz.',
            ],
          },
          {
            heading: '6. Rızanın Geri Çekilmesi',
            paragraphs: [
              'Çerez tercihlerinizi değiştirerek veya çerezleri silerek rızanızı geri çekebilirsiniz. Geri çekme, önceki işlemlerin hukukiliğini etkilemez.',
            ],
          },
        ],
      },
      terms: {
        key: 'terms',
        title: 'Kullanım Koşulları',
        description: 'FPVLovers hizmetlerinin kullanım koşulları, pilot sorumluluğu, fikri mülkiyet ve sorumluluk sınırları.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Kabul',
            paragraphs: [
              'fpvlovers.com.tr’yi kullanarak bu koşulları kabul edersiniz. Koşulları kabul etmiyorsanız siteyi ve araçları kullanmayın.',
            ],
          },
          {
            heading: '2. Hizmetin Niteliği',
            paragraphs: [
              'FPVLovers bir bilgi ve eğitim platformudur; e-ticaret sitesi değildir. Donanım satmaz, stok tutmaz, fiyat karşılaştırma motoru işletmez. İçerikler bilgilendirme amaçlıdır.',
            ],
          },
          {
            heading: '3. Pilot Sorumluluğu ve Güvenlik',
            paragraphs: [
              'FPV uçuşu ve donanım montajı elektriksel, fiziksel ve hukuki risk taşır. Hesaplayıcı, PID/blackbox önerisi ve parça eşleştirme çıktıları eğitim amaçlıdır. Bileşenleri, kablolamayı ve lehimleri doğrulamak; SHGM/SHY, FAA ve yerel kurallara uymak tamamen kullanıcının sorumluluğundadır.',
            ],
          },
          {
            heading: '4. Fikri Mülkiyet',
            paragraphs: [
              'Rehberler, hesaplayıcılar, sayfa düzeni ve grafikler telif hakkıyla korunur. Kişisel öğrenme ve yerel yapımlar için kullanılabilir; ticari amaçla otomatik kazıma veya çoğaltma yazılı izin gerektirir.',
            ],
          },
          {
            heading: '5. Ticari Bağlantılar',
            paragraphs: [
              'Bazı ürün bağlantıları affiliate veya sponsorluk içerebilir. Ticari bağlantılar açıkça etiketlenir; editöryel sonuçlar ticari ilişkiden bağımsızdır. Ayrıntılar için Ortaklık Açıklaması sayfasına bakın.',
            ],
          },
          {
            heading: '6. Sorumluluğun Sınırlandırılması',
            paragraphs: [
              'FPVLovers, geliştiricileri ve katkıda bulunanlar; araçların veya rehberlerin kullanımından doğan doğrudan, dolaylı, arızi veya sonuç olarak ortaya çıkan zararlardan sorumlu değildir. Araçlar “olduğu gibi” sunulur.',
            ],
          },
          {
            heading: '7. Hesap Güvenliği',
            paragraphs: [
              'Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz erişim fark ederseniz derhal hello@fpvlovers.com.tr adresine bildirin.',
            ],
          },
          {
            heading: '8. Uygulanacak Hukuk',
            paragraphs: [
              'Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici mevzuatından doğan haklar saklıdır. Uyuşmazlıklarda yetkili mahkemeler Türkiye’deki yerleşim yerinize göre belirlenir.',
            ],
          },
          {
            heading: '9. İletişim',
            paragraphs: [`Sorularınız için ${controller.email} adresine yazabilirsiniz. Veri sorumlusu: ${controllerLine(controller, 'tr')}.`],
          },
        ],
      },
    },
    en: {
      privacy: {
        key: 'privacy',
        title: 'Privacy Policy',
        description: 'How FPVLovers collects, uses, stores and protects personal data under GDPR, KVKK and CCPA principles.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Scope',
            paragraphs: [
              'This policy covers fpvlovers.com.tr. Turkish users have the rights described in our KVKK notice. Users in the EU/EEA have GDPR rights; California users have CCPA/CPRA transparency rights.',
            ],
          },
          {
            heading: '2. Data We Collect',
            paragraphs: ['Depending on the feature you use, we collect:'],
            bullets: [
              'Newsletter: email address, consent time and source.',
              'Contact: name, email, inquiry type and message.',
              'Account: name, email, password hash, OAuth provider identity and learning progress.',
              'Analytics: page/content identifiers, search event length and result count, device/browser type.',
              'Cookie choices and security logs.',
            ],
          },
          {
            heading: '3. How We Use Data',
            paragraphs: [
              'We use data to send the newsletter, answer inquiries, operate accounts and progress, secure the site, improve content through aggregated analytics, and meet legal obligations. We do not sell personal information.',
            ],
          },
          {
            heading: '4. Legal Bases',
            paragraphs: [
              'Under GDPR Art. 6 we rely on contract, legal obligation, legitimate interests and consent. Newsletter subscriptions, marketing and non-essential cookies require consent, which you can withdraw at any time.',
            ],
          },
          {
            heading: '5. Sharing and International Transfers',
            paragraphs: [
              'We share data with hosting, email delivery, AI/search infrastructure and analytics providers. Some providers may be located outside your country. Transfers rely on appropriate safeguards or your explicit consent. Affiliate links take you to a retailer’s own site, where that retailer’s policy applies.',
            ],
          },
          {
            heading: '6. Retention and Security',
            paragraphs: [
              'We keep data only as long as needed: newsletter consent for the subscription plus up to 2 years for proof, analytics events for up to 180 days, and contact inquiries for up to 1 year. We use TLS, access controls, password hashing and backups.',
            ],
          },
          {
            heading: '7. Your Rights',
            paragraphs: [
              'You have rights of access, correction, deletion, restriction, portability, objection and consent withdrawal under GDPR Arts. 15–22 and KVKK Art. 11. You can export or delete your account from the account menu or contact hello@fpvlovers.com.tr.',
            ],
          },
          {
            heading: '8. Children',
            paragraphs: [
              'The service is not directed to children under 13. Where local law requires parental consent for users under 16, that consent must be obtained.',
            ],
          },
          {
            heading: '9. California Notice',
            paragraphs: [
              'We do not sell personal information. California residents may request access, deletion and non-discrimination under CCPA/CPRA by contacting hello@fpvlovers.com.tr.',
            ],
          },
          {
            heading: '10. Contact',
            paragraphs: [`Data controller: ${controllerLine(controller, 'en')}. Email: ${controller.email}.`],
          },
        ],
      },
      cookies: {
        key: 'cookies',
        title: 'Cookie Policy',
        description: 'Cookies used on FPVLovers, their purposes and how to manage your choices.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. What Are Cookies?',
            paragraphs: [
              'Cookies are small text files stored by your browser. We use them for sessions, security and remembering your choices. Non-essential cookies load only with your consent.',
            ],
          },
          {
            heading: '2. Categories',
            paragraphs: ['We group cookies into three categories:'],
            bullets: [
              'Necessary: sign-in, CSRF protection and remembering your cookie choice.',
              'Analytics: page and search metrics, only with consent.',
              'Marketing: advertising or affiliate tracking pixels. Currently unused; if added, only with consent.',
            ],
          },
          {
            heading: '3. Cookie Table',
            paragraphs: ['Primary cookies:'],
            bullets: [
              'authjs.session-token — necessary — session — session lifetime.',
              'authjs.csrf-token — necessary — CSRF protection — session lifetime.',
              'fpv_consent — necessary — cookie choice — 1 year.',
              '_ga, _ga_* — analytics — Google Analytics — only with consent, up to 2 years.',
              'Retailer cookies — marketing — set by the affiliate retailer after you click — retailer policy.',
            ],
          },
          {
            heading: '4. Managing Choices',
            paragraphs: [
              'Use the “Cookie Preferences” link in the footer to change categories. You can also delete or block cookies in your browser; blocking necessary cookies may break sign-in.',
            ],
          },
          {
            heading: '5. Third-Party Cookies',
            paragraphs: [
              'Affiliate links take you to a retailer’s site, where that retailer’s cookies and policy apply. We do not run third-party advertising pixels on this site.',
            ],
          },
          {
            heading: '6. Withdrawing Consent',
            paragraphs: [
              'You can withdraw consent by changing your cookie preferences or deleting cookies. Withdrawal does not affect the lawfulness of prior processing.',
            ],
          },
        ],
      },
      terms: {
        key: 'terms',
        title: 'Terms of Service',
        description: 'Terms for using FPVLovers, including pilot responsibility, intellectual property and liability limits.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Acceptance',
            paragraphs: [
              'By using fpvlovers.com.tr you agree to these terms. If you do not agree, do not use the site or its tools.',
            ],
          },
          {
            heading: '2. Nature of the Service',
            paragraphs: [
              'FPVLovers is an educational knowledge platform, not an e-commerce store. We do not sell hardware, hold stock or operate a price comparison engine. Content is informational.',
            ],
          },
          {
            heading: '3. Pilot Responsibility and Safety',
            paragraphs: [
              'FPV flight and hardware assembly carry electrical, physical and legal risk. Calculator, PID/blackbox and part-matcher output is educational. You are responsible for verifying components, wiring and solder joints and for complying with SHGM/SHY, FAA and local rules.',
            ],
          },
          {
            heading: '4. Intellectual Property',
            paragraphs: [
              'Guides, calculators, layouts and graphics are copyrighted. You may use them for personal learning and local builds; commercial automated scraping or reproduction requires written permission.',
            ],
          },
          {
            heading: '5. Commercial Links',
            paragraphs: [
              'Some product links may be affiliate or sponsored. Commercial links are labeled and do not determine editorial conclusions. See the Affiliate Disclosure page for details.',
            ],
          },
          {
            heading: '6. Limitation of Liability',
            paragraphs: [
              'FPVLovers, its developers and contributors are not liable for direct, indirect, incidental or consequential damages arising from use of the tools or guides. Tools are provided “as is”.',
            ],
          },
          {
            heading: '7. Account Security',
            paragraphs: [
              'You are responsible for keeping your account credentials confidential. Report unauthorized access to hello@fpvlovers.com.tr.',
            ],
          },
          {
            heading: '8. Governing Law',
            paragraphs: [
              'These terms are governed by the laws of the Republic of Türkiye. Mandatory consumer rights remain unaffected.',
            ],
          },
          {
            heading: '9. Contact',
            paragraphs: [`Questions: ${controller.email}. Data controller: ${controllerLine(controller, 'en')}.`],
          },
        ],
      },
    },
  };
}

export function getLegalDocument(
  locale: 'tr' | 'en',
  key: 'privacy' | 'cookies' | 'terms' | 'kvkk',
  controller: LegalController,
): LegalDocument {
  const docs = buildLegalDocuments(controller)[locale];
  const document = (docs as Record<string, LegalDocument | undefined>)[key];
  if (!document) throw new Error(`Missing ${locale} legal document: ${key}`);
  return document;
}
```

- [ ] **Step 5: Add metadata helper**

`src/lib/legal/metadata.ts`:

```ts
import type { Metadata } from 'next';

const BASE = process.env.APP_URL || 'https://fpvlovers.com.tr';

export function legalMetadata({
  title,
  description,
  canonicalPath,
  languages,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  languages?: Record<string, string>;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}${canonicalPath}`,
      ...(languages
        ? { languages: Object.fromEntries(Object.entries(languages).map(([key, path]) => [key, `${BASE}${path}`])) }
        : {}),
    },
    openGraph: {
      title,
      description,
      url: `${BASE}${canonicalPath}`,
      siteName: 'FPV Lovers',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}
```

- [ ] **Step 6: Add the renderer and notice**

`src/features/legal/components/LegalDocumentPage.tsx`:

```tsx
import Link from 'next/link';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import type { LegalController } from '@/lib/legal/controller';
import type { LegalDocument } from '@/lib/legal/documents';
import { LEGAL_PAGE_PAIRS, legalPath } from '@/lib/legal/paths';
import type { Locale } from '@/lib/i18n/locale';

export function LegalDocumentPage({
  locale,
  document,
  controller,
}: {
  locale: Locale;
  document: LegalDocument;
  controller: LegalController;
}) {
  const isTr = locale === 'tr';
  return (
    <div className="fpv-public-shell mx-auto max-w-4xl px-4 py-12 pt-28 font-sans text-zinc-300 sm:px-6 lg:px-8">
      <CyberBreadcrumb
        items={[
          { label: isTr ? 'Ana Sayfa' : 'Home', href: isTr ? '/tr' : '/' },
          { label: document.title, isCurrentPage: true },
        ]}
        className="mb-8"
      />

      <header className="fpv-public-panel relative mb-10 overflow-hidden rounded-xl p-8 shadow-2xl md:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5C00]/45 to-transparent" />
        <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-100 md:text-5xl">{document.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">{document.description}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {isTr ? 'Son güncelleme' : 'Last updated'}: {document.updated}
        </p>
      </header>

      <div className="space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading} className="rounded-xl border border-white/5 bg-zinc-900/40 p-6 md:p-8">
            <h2 className="border-b border-white/5 pb-4 text-lg font-bold uppercase tracking-wider text-zinc-100">{section.heading}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-white/5 bg-zinc-950/60 p-6 text-sm text-zinc-400">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{isTr ? 'Veri sorumlusu' : 'Data controller'}</p>
        <p className="mt-2 text-zinc-200">{controller.name}</p>
        <p>{controller.address}</p>
        <p>{controller.email}{controller.kep ? ` · KEP: ${controller.kep}` : ''}{controller.taxId ? ` · ${isTr ? 'Vergi No' : 'Tax ID'}: ${controller.taxId}` : ''}</p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        <Link href={legalPath('privacy', locale)} className="hover:text-zinc-100">{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
        <Link href={legalPath('cookies', locale)} className="hover:text-zinc-100">{isTr ? 'Çerez Politikası' : 'Cookie Policy'}</Link>
        <Link href={legalPath('terms', locale)} className="hover:text-zinc-100">{isTr ? 'Kullanım Koşulları' : 'Terms of Service'}</Link>
        {isTr && <Link href={legalPath('kvkk', locale)} className="hover:text-zinc-100">KVKK Aydınlatma</Link>}
      </nav>

      <p className="mt-6 font-mono text-[10px] text-zinc-600">
        {isTr ? 'Hukuki metin sürümü' : 'Legal document version'}: {document.updated}
      </p>
    </div>
  );
}
```

`src/features/legal/components/LegalConfigurationNotice.tsx`:

```tsx
import type { Locale } from '@/lib/i18n/locale';

export function LegalConfigurationNotice({ locale }: { locale: Locale }) {
  return (
    <div className="fpv-public-shell mx-auto max-w-3xl px-4 py-12 pt-28">
      <div className="rounded-xl border border-[#FF5C00]/30 bg-[#FF5C00]/5 p-8 font-mono text-sm text-zinc-200">
        <h1 className="text-lg font-black uppercase tracking-wider text-[#FF5C00]">
          {locale === 'tr' ? 'Hukuki sayfa yapılandırması eksik' : 'Legal page configuration missing'}
        </h1>
        <p className="mt-4 leading-relaxed">
          {locale === 'tr'
            ? 'LEGAL_CONTROLLER_NAME, LEGAL_CONTROLLER_ADDRESS ve LEGAL_CONTROLLER_EMAIL ortam değişkenleri ayarlanmadan bu sayfa yayınlanmaz.'
            : 'Set LEGAL_CONTROLLER_NAME, LEGAL_CONTROLLER_ADDRESS and LEGAL_CONTROLLER_EMAIL before this page can be published.'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add the Turkish pages**

Her biri aynı iskeleti kullanır. `src/app/tr/kvkk-aydinlatma/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { LegalConfigurationNotice } from '@/features/legal/components/LegalConfigurationNotice';
import { LegalDocumentPage } from '@/features/legal/components/LegalDocumentPage';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';
import { getLegalDocument } from '@/lib/legal/documents';
import { legalMetadata } from '@/lib/legal/metadata';
import { legalPath } from '@/lib/legal/paths';

const controller = getLegalController();
const document = getLegalDocument('tr', 'kvkk', controller);

export const metadata = legalMetadata({
  title: `${document.title} | FPVLovers`,
  description: document.description,
  canonicalPath: legalPath('kvkk', 'tr'),
  languages: { en: '/privacy', tr: legalPath('kvkk', 'tr'), 'x-default': '/privacy' },
});

export default function Page() {
  if (!isLegalControllerConfigured(controller)) {
    if (process.env.NODE_ENV === 'production') notFound();
    return <LegalConfigurationNotice locale="tr" />;
  }
  return <LegalDocumentPage locale="tr" document={document} controller={controller} />;
}
```

`gizlilik-politikasi`, `cerez-politikasi`, `kullanim-kosullari` için aynı dosyayı kopyala ve yalnızca şu üç satırı değiştir:

```ts
const document = getLegalDocument('tr', 'privacy', controller);   // gizlilik-politikasi
const document = getLegalDocument('tr', 'cookies', controller);   // cerez-politikasi
const document = getLegalDocument('tr', 'terms', controller);     // kullanim-kosullari
```

ve `canonicalPath: legalPath('privacy', 'tr')`, `languages: { en: '/privacy', tr: legalPath('privacy', 'tr'), 'x-default': '/privacy' }` (diğer ikisi için `cookies`/`terms` ve `en` karşılıkları).

- [ ] **Step 8: Add the English cookie page**

`src/app/(en)/cookie-policy/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { LegalConfigurationNotice } from '@/features/legal/components/LegalConfigurationNotice';
import { LegalDocumentPage } from '@/features/legal/components/LegalDocumentPage';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';
import { getLegalDocument } from '@/lib/legal/documents';
import { legalMetadata } from '@/lib/legal/metadata';
import { legalPath } from '@/lib/legal/paths';

const controller = getLegalController();
const document = getLegalDocument('en', 'cookies', controller);

export const metadata = legalMetadata({
  title: `${document.title} | FPVLovers`,
  description: document.description,
  canonicalPath: legalPath('cookies', 'en'),
  languages: { en: legalPath('cookies', 'en'), tr: legalPath('cookies', 'tr'), 'x-default': legalPath('cookies', 'en') },
});

export default function Page() {
  if (!isLegalControllerConfigured(controller)) {
    if (process.env.NODE_ENV === 'production') notFound();
    return <LegalConfigurationNotice locale="en" />;
  }
  return <LegalDocumentPage locale="en" document={document} controller={controller} />;
}
```

- [ ] **Step 9: Replace the English privacy and terms pages**

`src/app/(en)/privacy/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { LegalConfigurationNotice } from '@/features/legal/components/LegalConfigurationNotice';
import { LegalDocumentPage } from '@/features/legal/components/LegalDocumentPage';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';
import { getLegalDocument } from '@/lib/legal/documents';
import { legalMetadata } from '@/lib/legal/metadata';
import { legalPath } from '@/lib/legal/paths';

const controller = getLegalController();
const document = getLegalDocument('en', 'privacy', controller);

export const metadata = legalMetadata({
  title: `${document.title} | FPVLovers`,
  description: document.description,
  canonicalPath: legalPath('privacy', 'en'),
  languages: { en: legalPath('privacy', 'en'), tr: legalPath('privacy', 'tr'), 'x-default': legalPath('privacy', 'en') },
});

export default function Page() {
  if (!isLegalControllerConfigured(controller)) {
    if (process.env.NODE_ENV === 'production') notFound();
    return <LegalConfigurationNotice locale="en" />;
  }
  return <LegalDocumentPage locale="en" document={document} controller={controller} />;
}
```

`src/app/(en)/terms/page.tsx` aynı iskelet; `getLegalDocument('en', 'terms', controller)`, `legalPath('terms', 'en')`, `languages` içinde `terms`.

- [ ] **Step 10: Update the footer**

`src/features/layout/components/SiteFooter.tsx`:
- Import `CookiePreferencesLink`, `legalPath`.
- `legalGroups` sabitini kaldır ve bileşen içinde üret:

```tsx
  const isTr = locale === 'tr';
  const legalGroups = [
    {
      label: isTr ? 'Yasal' : 'Legal',
      links: [
        ...(isTr ? [{ title: 'KVKK Aydınlatma', href: legalPath('kvkk', locale) }] : []),
        { title: isTr ? 'Gizlilik Politikası' : 'Privacy Policy', href: legalPath('privacy', locale) },
        { title: isTr ? 'Çerez Politikası' : 'Cookie Policy', href: legalPath('cookies', locale) },
        { title: isTr ? 'Kullanım Koşulları' : 'Terms of Service', href: legalPath('terms', locale) },
      ],
    },
    {
      label: isTr ? 'Platform' : 'Platform',
      links: [
        { title: isTr ? 'Yayın İlkeleri' : 'Editorial Policy', href: '/editorial-policy' },
        { title: isTr ? 'Kurallar' : 'Regulations', href: '/regulations' },
        { title: isTr ? 'Sözlük' : 'Glossary', href: '/academy/glossary' },
      ],
    },
    {
      label: isTr ? 'Bağlantı' : 'Connect',
      links: [
        { title: isTr ? 'Reklam' : 'Advertise', href: '/advertise' },
        { title: isTr ? 'İletişim' : 'Contact', href: '/contact' },
        { title: isTr ? 'Ortaklık Açıklaması' : 'Affiliate Disclosure', href: '/disclosure' },
      ],
    },
  ];
```

- Legal linklerin render bloğunda `footerCopy[link.href] ?? link.title` yerine `link.title` kullan ve hemen altına tercih butonunu ekle:

```tsx
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className="py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200">
                      {link.title}
                    </Link>
                  ))}
                  {group.label === (isTr ? 'Yasal' : 'Legal') && <CookiePreferencesLink locale={locale} />}
```

- `FOOTER_COPY_TR` artık legal linkler için kullanılmıyor; diğer linklerde kalmaya devam eder.

- [ ] **Step 11: Add legal pages to the sitemap**

`src/app/sitemap.xml/route.ts`:
- Import: `import { LEGAL_PAGE_PAIRS, LEGAL_PATHS } from '@/lib/legal/paths';`
- Yardımcı ekle:

```ts
function legalAlternates(en: string, tr: string): string {
  return [
    `      <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${en}" />`,
    `      <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${tr}" />`,
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${en}" />`,
  ].map((link) => `\n${link}`).join('');
}

function legalUrl(path: string, alternates = ''): string {
  return `
    <url>
      <loc>${BASE_URL}${path}</loc>
      <priority>0.4</priority>
      <changefreq>yearly</changefreq>${alternates}
    </url>`;
}
```

- `GET` içinde:

```ts
  const legalUrls = LEGAL_PAGE_PAIRS.flatMap(({ en, tr }) => [
    legalUrl(en, legalAlternates(en, tr)),
    legalUrl(tr, legalAlternates(en, tr)),
  ]);
  const turkishOnlyLegalUrls = [legalUrl(LEGAL_PATHS.tr.kvkk)];
```

- `urls` birleşimine ekle:

```ts
  const urls = [...staticUrls, ...dynamicUrls, ...turkishStaticUrls, ...turkishArticleUrls, ...legalUrls, ...turkishOnlyLegalUrls].join('\n');
```

- [ ] **Step 12: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (16 checks).

- [ ] **Step 13: Build check**

Run: `pnpm lint`  
Expected: 0 errors. Hataları düzelt, testi tekrar çalıştır.

- [ ] **Step 14: Commit**

```bash
git add src/lib/legal src/features/legal src/app/tr/kvkk-aydinlatma src/app/tr/gizlilik-politikasi src/app/tr/cerez-politikasi src/app/tr/kullanim-kosullari "src/app/(en)/cookie-policy" "src/app/(en)/privacy/page.tsx" "src/app/(en)/terms/page.tsx" src/features/layout/components/SiteFooter.tsx src/app/sitemap.xml/route.ts scripts/privacy-compliance-regression-test.ts
git commit -m "feat(legal): publish Turkish and English privacy documents"
```

---

## Task 6: Toplama noktalarında aydınlatma ve onay

**Files:**
- Modify: `src/features/tools/components/NewsletterWidget.tsx`
- Modify: `src/features/layout/components/CookieBanner.tsx` (already done; only if a locale link is needed)
- Modify: `src/app/(en)/contact/ContactForm.tsx`
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/(en)/auth/signin/page.tsx`
- Modify: `src/app/api/pilot/register/route.ts`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Consumes: `LEGAL_DOCUMENT_VERSION`, `legalPath`.
- Produces: newsletter request body includes `consent: true` and `locale`.
- Produces: contact request body includes `privacyAcknowledged: true`.
- Produces: registration request body includes `acceptedTerms: true` and `ageAttested: true`.

- [ ] **Step 1: Append failing tests**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: FAIL — no consent fields in the widgets/routes.

- [ ] **Step 3: Update the newsletter widget**

`src/features/tools/components/NewsletterWidget.tsx`:
- Import `legalPath`, `type Locale`.
- Prop: `export function NewsletterWidget({ className, locale = 'en' }: { className?: string; locale?: Locale })`.
- Add state: `const [consent, setConsent] = useState(false);`
- `if (!email || !consent) return;` in subscribe.
- Body: `JSON.stringify({ email, source: 'tools_hub_widget', consent: true, locale })`.
- Form altına onay satırı ekle:

```tsx
<label className="mt-3 flex items-start gap-2 text-left text-[10px] leading-relaxed text-white/50">
  <input
    type="checkbox"
    checked={consent}
    onChange={(event) => setConsent(event.target.checked)}
    className="mt-0.5"
  />
  <span>
    {locale === 'tr' ? (
      <>Bülten almak istiyorum. <a className="text-[#00F5FF] underline" href={legalPath('kvkk', locale)}>KVKK Aydınlatma Metni</a> ve <a className="text-[#00F5FF] underline" href={legalPath('cookies', locale)}>Çerez Politikası</a>’nı okudum.</>
    ) : (
      <>I want to receive the newsletter. I have read the <a className="text-[#00F5FF] underline" href={legalPath('privacy', locale)}>Privacy Policy</a>.</>
    )}
  </span>
</label>
```

- Success metnini çift onaya uygun hale getir: `Subscription confirmed` yerine `Check your inbox to confirm` / `Onay e-postanızı kontrol edin`. Submit butonunu `disabled={!consent}` yap.

- [ ] **Step 4: Update the contact form**

`src/app/(en)/contact/ContactForm.tsx`:
- Import `legalPath`.
- State: `privacyAcknowledged: false`.
- Body: `JSON.stringify({ ...formData, privacyAcknowledged })`.
- Client validation: `if (!privacyAcknowledged) clientErrors.push('Please acknowledge the privacy notice.');`
- Submit öncesi checkbox:

```tsx
<label className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-400">
  <input
    type="checkbox"
    checked={privacyAcknowledged}
    onChange={(event) => setPrivacyAcknowledged(event.target.checked)}
    className="mt-0.5"
  />
  <span>
    I have read the <a className="text-[#FF5C00] underline" href={legalPath('privacy', 'en')}>Privacy Policy</a> and understand how my message is processed.
  </span>
</label>
```

- Reset fonksiyonunda `privacyAcknowledged: false` ekle.

- [ ] **Step 5: Validate the contact API**

`src/app/api/contact/route.ts`:
- `const { name, email, inquiryType, message, privacyAcknowledged } = body;`
- Validation bloğuna ekle:

```ts
    if (privacyAcknowledged !== true) {
      errors.push('Please acknowledge the privacy notice.');
    }
```

- [ ] **Step 6: Update sign-in**

`src/app/(en)/auth/signin/page.tsx`:
- Import `legalPath`, `LEGAL_DOCUMENT_VERSION` (version sadece body'de gerekmiyorsa import etme; server sabiti kullanır).
- State: `const [acceptedTerms, setAcceptedTerms] = useState(false); const [ageAttested, setAgeAttested] = useState(false);`
- Register fetch body: `JSON.stringify({ email, password, name, acceptedTerms: true, ageAttested: true })` — checkbox'lar işaretli değilse submit engellenir.
- `handleCredentialsSubmit` başında, `isSignUp` ise:

```ts
      if (!acceptedTerms || !ageAttested) {
        throw new Error('Kullanım koşullarını ve gizlilik metnini kabul etmeniz gerekir.');
      }
```

- Formun altına, yalnızca `isSignUp` iken:

```tsx
{isSignUp && (
  <div className="space-y-2 border-t border-white/5 pt-4">
    <label className="flex items-start gap-2 text-[10px] leading-relaxed text-gray-400">
      <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5" />
      <span>
        <a className="text-[#00F2FF] underline" href={legalPath('terms', 'tr')}>Kullanım Koşulları</a> ve{' '}
        <a className="text-[#00F2FF] underline" href={legalPath('kvkk', 'tr')}>KVKK Aydınlatma Metni</a>’ni okudum, kabul ediyorum.
      </span>
    </label>
    <label className="flex items-start gap-2 text-[10px] leading-relaxed text-gray-400">
      <input type="checkbox" checked={ageAttested} onChange={(event) => setAgeAttested(event.target.checked)} className="mt-0.5" />
      <span>13 yaşından büyüğüm.</span>
    </label>
  </div>
)}
```

- [ ] **Step 7: Update the registration API**

`src/app/api/pilot/register/route.ts`:
- Import `LEGAL_DOCUMENT_VERSION`.
- Schema:

```ts
const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.').max(128, 'Password is too long.'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.').max(120, 'Name is too long.'),
  acceptedTerms: z.literal(true, { message: 'You must accept the terms and privacy notice.' }),
  ageAttested: z.literal(true, { message: 'You must confirm you are at least 13 years old.' }),
});
```

- INSERT:

```ts
    const result = await query(
      `INSERT INTO fpvlovers_app.users
         (name, email, password_hash, role, terms_accepted_at, terms_version, age_attested_at)
       VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
       RETURNING id, name, email, role`,
      [name, trimmedEmail, passwordHash, 'pilot', LEGAL_DOCUMENT_VERSION]
    );
```

- [ ] **Step 8: Run test to verify it passes**

Run: `node --import tsx scripts/privacy-compliance-regression-test.ts`  
Expected: PASS (19 checks).

- [ ] **Step 9: Commit**

```bash
git add src/features/tools/components/NewsletterWidget.tsx "src/app/(en)/contact/ContactForm.tsx" src/app/api/contact/route.ts "src/app/(en)/auth/signin/page.tsx" src/app/api/pilot/register/route.ts scripts/privacy-compliance-regression-test.ts
git commit -m "feat(privacy): add notices and acceptance to collection points"
```

---

## Task 7: Env, script ve tam doğrulama

**Files:**
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-10-31-kvkk-gdpr-compliance-design.md`
- Test: `scripts/privacy-compliance-regression-test.ts`

**Interfaces:**
- Produces: `pnpm privacy:test`.

- [ ] **Step 1: Add env placeholders**

`.env.example` sonuna ekle:

```bash
# Privacy / legal configuration
NEWSLETTER_TOKEN_SECRET=
LEGAL_CONTROLLER_NAME=
LEGAL_CONTROLLER_ADDRESS=
LEGAL_CONTROLLER_EMAIL=hello@fpvlovers.com.tr
LEGAL_CONTROLLER_KEP=
LEGAL_CONTROLLER_TAX_ID=
```

- [ ] **Step 2: Add the package script**

`package.json` `scripts` içine ekle:

```json
    "privacy:test": "node --import tsx scripts/privacy-compliance-regression-test.ts",
```

- [ ] **Step 3: Update the design doc status**

`docs/superpowers/specs/2026-10-31-kvkk-gdpr-compliance-design.md` başındaki `**Durum:**` satırını şu yap:

```markdown
**Durum:** P0 planı yazıldı (`docs/superpowers/plans/2026-10-31-kvkk-gdpr-compliance-p0.md`); uygulama ve hukuki metin onayı bekliyor.
```

Migration notunu güncelle: `unsubscribe_token_hash` yerine HMAC tabanlı deterministik token kullanıldığını, saklanan token hash'i olmadığını yaz.

- [ ] **Step 4: Run the full regression suite**

```bash
pnpm privacy:test
pnpm lint
node .gitnexus/run.cjs detect-changes --scope all --repo .
```

Expected:
- `privacy:test` → tüm check'ler PASS.
- `lint` → 0 error.
- `detect-changes` → `partial`/`truncated` yok; değişen dosyalar beklenen liste.

- [ ] **Step 5: Manual browser verification**

```bash
pnpm dev --port 3011
```

- Gizli pencerede `http://localhost:3011` aç: GA/`gtag` ağ isteği **yok**, banner görünür.
- "Zorunlu olmayanları reddet" → `fpv_consent` çerezi yazılır, GA isteği yok.
- "Tercihleri yönet" → Analytics'i aç → Kaydet → sayfa yenile → GA isteği var.
- Footer → "Çerez Tercihleri" → panel açılır.
- `http://localhost:3011/tr/kvkk-aydinlatma` → controller env yoksa dev uyarısı; env varsa metin görünür.
- `/tr/gizlilik-politikasi`, `/tr/cerez-politikasi`, `/tr/kullanim-kosullari`, `/cookie-policy`, `/privacy`, `/terms` → 200.
- Bülten formu: checkbox işaretlenmeden gönderilemez; gönderim sonrası "onay e-postanızı kontrol edin".
- İletişim formu: checkbox işaretlenmeden gönderilemez.
- Kayıt formu: iki checkbox işaretlenmeden kayıt olunamaz.

- [ ] **Step 6: Commit**

```bash
git add .env.example package.json docs/superpowers/specs/2026-10-31-kvkk-gdpr-compliance-design.md
git commit -m "chore(privacy): add compliance verification script and legal configuration"
```

---

## Deployment Gate

Aşağıdakiler tamamlanmadan production deploy yapılmaz:

- [ ] `LEGAL_CONTROLLER_NAME`, `LEGAL_CONTROLLER_ADDRESS`, `LEGAL_CONTROLLER_EMAIL` Coolify env'e girildi. (Yoksa hukuki sayfalar 404 döner ve yazma uçları `503` verir.)
- [ ] `NEWSLETTER_TOKEN_SECRET` en az 32 karakter olarak girildi.
- [ ] `CRON_SECRET` ayarlandı (retention cron'u için).
- [ ] `pnpm db:migrate` production'da çalıştırıldı (migration 0011).
- [ ] Mevcut bülten aboneleri için yeniden onay stratejisi kararlaştırıldı; `consent_at IS NULL` olan satırlara otomatik gönderim yapılmadığı doğrulandı.
- [ ] **Retention cron'u zamanlanmadan önce** yeniden onay kampanyası kararı verildi. `GET /api/admin/cron/privacy-retention` ilk çalıştığında `status='active' AND consent_at IS NULL` ve 30 günden eski kayıtları kalıcı olarak siler.
- [ ] Coolify'da `GET /api/admin/cron/privacy-retention` günlük zamanlanmış görev olarak eklendi (runtime imajında `scripts/` yok).
- [ ] Hukuki metinler KVKK/GDPR danışmanı tarafından okundu.
- [ ] `pnpm privacy:test` ve `pnpm lint` production dalında yeşil.
- [ ] Push sonrası Coolify'da manuel deploy tetiklendi ve container SHA doğrulandı.

## Self-Review Notları

- **Spec kapsamı:** Bülten sızıntısı (Task 3), unsubscribe/çift onay (Task 2–3), GA rıza kapısı (Task 4), Türkçe KVKK/çerez/kullanım sayfaları (Task 5), form onayları (Task 6), veri sorumlusu bloğu (Task 5), yanıltıcı gizlilik metni (Task 5).
- **P1'e bırakılanlar:** İYS API entegrasyonu, DSAR formu/`privacy_requests`, hesap ihracı/silme, ROPA/TIA/breach runbook, İngilizce KVKK/CCPA ayrı sayfaları, ortaklık/yayın ilkeleri TR çevirisi. (Analitik saklama temizliği P0'a çekildi; `/api/admin/cron/privacy-retention` ile zorunlu.)
- **Bilinen sınır:** OAuth ile ilk kez giriş yapan kullanıcılar kayıt formundaki checkbox'ı görmez; `terms_accepted_at` boş kalır. P1'de oturum sonrası onay kapısı eklenecek. Bu, P0'ın "kritik sızıntı ve rıza" hedefini engellemez.
- **Controller env yoksa:** Production'da hukuki sayfalar 404 döner, bülten/iletişim/kayıt/`/api/consent` uçları `503` verir; bu bilinçli bir yayın kapısıdır, hata değildir. Geliştirmede sayfalar 404 yerine yapılandırma uyarısı gösterir ve uçlar çalışır.
- **Çerez yazımı sunucu onayına bağlı:** `fpv_consent` yalnızca `/api/consent` 2xx döndükten sonra yazılır; uç `503`/`500` verirse çerez yazılmaz, GA yüklenmez ve bantta hata mesajı görünür. Böylece denetim kaydı olmadan analitik açılamaz (DB kesintisi ve eksik controller dahil). Build sırasında env okunmadığı için bu kapı bilinçli olarak istemci tarafındadır; statik sayfalar da doğru davranır.

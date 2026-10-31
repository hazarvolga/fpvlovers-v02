# KVKK / GDPR P0 Compliance Release — Handoff (2026-10-31)

## Status

- **Released and verified in production.** Deployed revision `07e1c2b`, pushed to `origin/main` (`hazarvolga/fpvlovers-v02`). The docs-only commits that record this handoff come after it and are local.
- Live container image tag: `07e1c2b956f0b337729b0eb120472557c2420c95` (Coolify app `jnlhgqmjnqwpdgefsoskew5n`, `https://fpvlovers.com.tr`), `/api/ready` → `status: "ready"`.
- Migration `0011_privacy_compliance_foundation.sql` applied to `gkmzgwnnirofcgpw2yh0bnlh` (`fpvlovers` DB); recorded in `schema_migrations` on 2026-10-31 together with the previously unapplied `0010` (see below).
- `fpvlovers_app.published_articles_shadow` repaired on 2026-10-31: 153 rows backfilled, DB reads no longer fall back to files.
- **Mail authentication DNS published 2026-10-31** (browser session on the Cloudflare dashboard): apex MX `10 mail.affexai.tr`, apex SPF `v=spf1 mx -all`, DKIM `v1-ed25519-20261031` + `v1-rsa-20261031`, and `_dmarc p=quarantine` all resolve from `dante.ns.cloudflare.com` and 8.8.8.8.
- **One item remains, outside engineering's reach:** lawyer review of the legal texts (user action).

## Why this exists

Owner instruction (2026-10-31): make sure the project complies with KVKK data-collection / prior-notice obligations, globally (GDPR/CCPA), so the site cannot be sanctioned. The P0 plan is committed at `docs/superpowers/plans/2026-10-31-kvkk-gdpr-compliance-p0.md`.

## What shipped (code)

Commits `3663f5c..07e1c2b` (privacy series), deployed together with the earlier i18n lane `2c06789..26ccafd`:

- Consent and newsletter data model + migration `0011`: `newsletter_subscribers.status/confirmed_at/consent_at/consent_version/consent_source` (+ backfill + status CHECK), `users.terms_accepted_at/terms_version/age_attested_at`, `fpvlovers_app.consent_records`.
- Cookie banner (`ConsentProvider`) with `fpv_consent` cookie (`CONSENT_VERSION=2026-10-31`). Fail-closed: the cookie is written **only after** `/api/consent` returns 2xx; a withdrawal is applied locally and the page reloads even when the API is down.
- GA (`G-ZTMJYH67QW`) loads only when `analytics: true`. CSP allowlists `https://www.googletagmanager.com` in `script-src`; no `unsafe-eval` (webpack dev does not hydrate under this CSP — Turbopack required for client-side checks).
- Legal documents in Turkish and English: `/tr/{kvkk-aydinlatma,gizlilik-politikasi,cerez-politikasi,kullanim-kosullari}` and `/privacy`, `/terms`, `/cookie-policy`, all in the sitemap.
- Newsletter double opt-in: HMAC tokens (`NEWSLETTER_TOKEN_SECRET`), `NEWSLETTER_CONSENT_VERSION`, per-recipient confirmation/unsubscribe links, `List-Unsubscribe` header, generic 202 response.
- Contact and pilot registration require explicit acknowledgement/terms; the three write endpoints return **503 in production** when the controller identity is not configured (fail-closed).
- Retention enforcement `purgeExpiredPrivacyData` (analytics 180 d, unconfirmed subscriptions 30 d, unsubscribe proof 2 y, consent records 5 y), exposed as `GET /api/admin/cron/privacy-retention` (`CRON_SECRET`; 401 unauth, 503 if the secret is unset). The runtime image ships no `scripts/` or `tsx`, so the HTTP route is the only in-container entry point.

## Production configuration applied

- `LEGAL_CONTROLLER_NAME=Hazar Volga Ekiz`, `LEGAL_CONTROLLER_ADDRESS=İsmetpaşa Mah. Taner Sokak No:21, Yalova`, `LEGAL_CONTROLLER_EMAIL=hello@fpvlovers.com.tr` (+ optional `LEGAL_CONTROLLER_KEP`, `LEGAL_CONTROLLER_TAX_ID`, currently unset).
- `NEWSLETTER_TOKEN_SECRET` generated; stored on the host at `/root/fpv-app-secrets.env` (0600). `CRON_SECRET` already existed.
- SMTP wired: `SMTP_HOST=mail.affexai.tr`, `SMTP_PORT=465` (implicit TLS; 587 is closed publicly and from app containers), `SMTP_USER`/`SMTP_FROM_EMAIL=hello@fpvlovers.com.tr`, `SMTP_PASS` (mailbox secret at `/root/fpv-mail-credentials`, 0600).
- **Ruling recorded:** production had no SMTP configuration at all before this release, so double opt-in and the contact form could never send mail. Wiring the mailbox was a release blocker.

## Mail server state (shared Stalwart v0.16.26)

- Service `affexai-mail`, Coolify uuid `fnu2ihmmmk0jmc7v2kj5yaxq`, project `affexai-cortex`, `mail.affexai.tr`.
- Mailbox `hello@fpvlovers.com.tr` created on domain `fpvlovers.com.tr`.
- Aliases added 2026-10-31: `postmaster@`, `abuse@`, `newsletter@` → all deliver into the `hello` INBOX (verified). `postmaster@` is required by RFC 5321 and by the generated DMARC `rua`.
- **No admin credentials exist.** Management requires `STALWART_RECOVERY_ADMIN` on a throwaway container with the live store mounted (RocksDB LOCK forbids a second process). The live server is stopped for ~5 s per change; the helper script's `finally` block always restarts it. Rehearse payload shape before mutating: `x:Account/set` `aliases` is a Set keyed by **integer strings** (`"0"`, `"1"`), not `#name` keys.
- Outbound DKIM verified from delivered message headers: `ed25519-sha256` selector `v1-ed25519-20261031` and `rsa-sha256` selector `v1-rsa-20261031`.
- `mail.affexai.tr` → `169.58.96.15` (the sending IP), rDNS = `mail.affexai.tr`, no AAAA, so `v=spf1 mx -all` will pass once DNS exists.

## Production database repair (post-release, 2026-10-31)

Drift found while preparing the Turkish (C2) lane: the deployed code reads published content from `fpvlovers_app.published_articles_shadow` with `WHERE locale = $1`, but migration `0010` had never been applied and the table was empty. Every DB read threw `column "locale" does not exist` and the app silently fell back to the committed JSON files (`[Published Content] Database read failed…`, 48 hits in 72 h). Public pages looked fine because the merge in `listPublishedContentAsync` prefers the file copy on equal timestamps, but the DB mirror, admin views and the Turkish lane were broken.

Applied in this order:

1. `0010_published_content_locale.sql` via `psql --single-transaction` (table was empty, so the PK swap was free): `locale TEXT NOT NULL DEFAULT 'en'`, unique `(slug, locale)`, index `(locale, published_at DESC)`.
2. Backfilled **153/153** rows (`locale='en'`) from `/app/content/published/*.json` inside the web container, replicating `upsertPublishedArtifact` (`tags = seo.keywords`, `json_path`/`markdown_path`, `json_hash = sha256(JSON.stringify(artifact))`, `markdown_hash` NULL, `metadata` = artifact, `ON CONFLICT (slug, locale)`). The 10 retired duplicates are already deleted from the volume, so nothing needed filtering. The runtime image ships no `scripts/` or `tsx`, so the backfill ran as a throwaway script piped into the container and removed afterwards.
3. Recorded `0010` (`published_content_locale`, checksum `0c1a016f…b342a`) and `0011` (`privacy_compliance_foundation`, checksum `4ffffcf8…cf1b`) in `schema_migrations`. `0011`'s DDL had been applied manually at release time but never recorded, so the runner would have re-executed it.
4. Verified: 153 rows / 153 distinct slugs / all `en`, zero nulls, `metadata->>'slug' = slug` everywhere; `/api/ready` still `ready` (`storageMode: dual`); `/guides`, `/search?q=lipo`, `/academy`, `/article/<slug>` and `/tr` 200; retired slug 308 → canonical; sitemap 204 URLs; zero `Database read failed` / `Database lookup failed` lines in the container log after the repair.

Known deviation: `json_hash` is the hash of the on-disk artifact (what the row mirrors), whereas a live publish stores the `ensureMediaArtifact`-normalised object. Nothing reads `json_hash` today and DB reads normalise on the way out (`content-reader.ts`), so behaviour matches the file path.

Still zero in production after the Contabo consolidation: `users`, `accounts`, `newsletter_subscribers`, `consent_records`. The empty `users` table means nobody can sign in to `/admin` (it answers 401); the bootstrap path is `scripts/create-super-admin.ts` run against the prod DB.

## Coolify scheduled tasks (all on application 3 / `fpvlovers-web`)

| id | name | command | frequency |
| --- | --- | --- | --- |
| 3 | FPVLovers Nightly Crawler | `wget -qO- --header="x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/admin/cron/crawl` | `15,45 1,3,4 * * *` |
| 4 | FPVLovers Early Morning Content Gen | `… /api/admin/cron/generate` | `30 5 * * *` |
| 5 | FPVLovers Privacy Retention (added 2026-10-31) | `… /api/admin/cron/privacy-retention` | `0 4 * * *` |

`ScheduledJobManager` reads `scheduled_tasks` from the DB on each run, so new rows need no restart. The earlier "do not schedule retention yet" ruling was tied to protecting a legacy subscriber list; production had `newsletter_subscribers = 0` and `consent_records = 0`, so it no longer applied.

## Verification evidence

- HTTP gates: `/api/consent` invalid 400 / valid 200 (no longer 503); newsletter/contact/pilot reject invalid input with 400; retention cron unauth 401; newsletter confirm/unsubscribe with a bogus token 400; `/api/ready` 200.
- Legal pages: all seven routes 200 and render controller name/address/e-mail; sitemap lists all seven.
- Browser (production): no `googletagmanager` request before a decision; reject → consent record 200, no GA; accept analytics → gtag loads; withdraw analytics → reload, cookie `analytics:false`, no gtag, `_ga*` cookies cleared. API-down paths verified fail-closed.
- Mail end-to-end: confirmation and contact inquiry delivered to `hello@`; inbound SMTP to port 25 accepted; aliases deliver; DKIM signatures present.
- Retention purge proven with marked rows (old consent 6 y, pending 40 d, legacy active 40 d, unsubscribed 3 y) → `purged: {pending:1, legacy:1, unsubscribed:1, consent:1}`; fresh controls survived; test rows removed afterwards. Both tables are back to 0 rows. This also confirms `fpvlovers_analytics.events` exists in production.
- Test suites before deploy: `pnpm privacy:test` 29/29, `pnpm lint` 0, `pnpm exec tsc --noEmit` 0, `routes:audit` 131 route files.

## Open items

### 1. Cloudflare DNS — DONE (2026-10-31)

Published through the Cloudflare dashboard in the owner's browser session (no API token on the host, Cloudflare MCP is docs-only). The zone now has 13 records; the five added are:

```text
fpvlovers.com.tr.                        MX    10 mail.affexai.tr.
fpvlovers.com.tr.                        TXT   "v=spf1 mx -all"
v1-ed25519-20261031._domainkey           TXT   "v=DKIM1; k=ed25519; h=sha256; p=PGbBVrxbH7dP+W2tUikQLGT5u3kusbBQ5cvB/8QwYq0="
v1-rsa-20261031._domainkey               TXT   "v=DKIM1; k=rsa; h=sha256; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0qfxi+xqbmmV1OJLHmRDYOm7c1OQcICQ5+Gb+x8TnW4/UsRhs4AigahCTDz75EXawJLdVC/Fm9vvEebTZQqJqI/dt44cZn+ofl/UacBhv/D/oFT8DHLAsEfz11UJrEf3izEkv6jhGz0/qDrl6Pj9+AoiblWwuAaomBUFrMRA6gfJQ9e3V9YXJYc7BPgs5IftgI4o2ytX07eiXid+B09cozLp/YGiLdhvZ+4ZK9L+vd7IKCEaaWGHPyD47+MS5Y7snJFwgOF9ARVcQHWZhyGcUfXAFIhyh4eL7jw0yr1KCrqeDaOIUoJa39L5DTAdJwzhzZ1kMQlZVuka7b4oJppMaQIDAQAB"
_dmarc                                   TXT   "v=DMARC1; p=quarantine; rua=mailto:postmaster@fpvlovers.com.tr; adkim=r; aspf=r; pct=100"
```

Cloudflare split the 2048-bit RSA value into two 255-byte strings automatically, which is correct. Verified with `dig` against `dante.ns.cloudflare.com` and `8.8.8.8`; pre-existing records (`send.` subdomain for Amazon SES/Resend, `resend._domainkey`, Google site verification, four proxied-less A records) were left untouched.

DMARC starts at `p=quarantine` (the generated zone file says `p=reject`); tighten to reject once aggregate reports from the first days are clean. Inbound proven on 2026-10-31 22:26 (Gmail → `hello@`): Stalwart recorded `Authentication-Results … spf=pass (209.85.210.44) dkim=pass header.d=gmail.com dmarc=pass` and `Received-SPF: pass`. The remaining check is the outbound direction: one message delivered to a Gmail inbox and inspected with "Show original" to confirm `spf=pass dkim=pass dmarc=pass` for `d=fpvlovers.com.tr`.

Historical note: before this, the zone had no apex MX/SPF/DKIM/DMARC, so external inbound depended on the implicit-MX fallback and DMARC reports could not arrive.

### 2. Lawyer review (user action)

The texts are written to match actual code behaviour (rights requests route to `hello@fpvlovers.com.tr`, 30-day response, no account-menu export/delete promise). They still need legal review, and the controller identity may need KEP / tax ID fields populated in Coolify if the lawyer asks for them.

## Known limitations / decisions to respect

- GitNexus MCP/CLI is unusable in this environment (`@ladybugdb/core` build/openssl); impact analysis and `detect-changes` were substituted with `rg`, `graphify`, `tsc`, `eslint` and explicit diff review. Do not assume a clean graph check happened.
- Do not weaken the production CSP to make webpack dev hydrate.
- Do not schedule or run retention against a legacy subscriber list without a re-consent decision first: `status='active' AND consent_at IS NULL` rows older than 30 days are deleted by design.
- Never put `.env` values, Coolify env backups, SSH keys or mailbox secrets in the repo. Host secret paths are listed above and must stay outside Git.
- Coolify-native only; never touch the AffeXAI Cortex or Bimmetraj resources. No n8n/n8nac references in new code or docs.

## Exact resume point

1. Mail DNS is published and inbound authentication is proven (see Open item 1). What is left is the outbound direction: send one message from `hello@fpvlovers.com.tr` (webmail https://webmail.affexai.tr) to a Gmail inbox and read "Show original" for `spf=pass dkim=pass dmarc=pass` with `d=fpvlovers.com.tr`; after a few days of clean aggregate reports, switch DMARC to `p=reject` in Cloudflare.
2. Hand the legal texts to the lawyer; apply any wording changes as a new commit and redeploy.
3. Then pick up the Turkish article pipeline plan at `docs/superpowers/plans/2026-10-31-turkish-articles-c2.md` (committed in `5368c1a`; not implemented). The DB mirror it depends on is now repaired.
4. Admin access is still unprovisioned (`users` = 0): decide whether to create the owner account with `scripts/create-super-admin.ts` before the deferred admin-panel review.
5. Detailed session ledger (git-ignored): `.superpowers/sdd/2026-10-31-kvkk-gdpr-compliance-p0/progress.md`.

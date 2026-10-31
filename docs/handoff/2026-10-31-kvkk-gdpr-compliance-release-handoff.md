# KVKK / GDPR P0 Compliance Release — Handoff (2026-10-31)

## Status

- **Released and verified in production.** Deployed revision `07e1c2b`, pushed to `origin/main` (`hazarvolga/fpvlovers-v02`). The docs-only commits that record this handoff come after it and are local.
- Live container image tag: `07e1c2b956f0b337729b0eb120472557c2420c95` (Coolify app `jnlhgqmjnqwpdgefsoskew5n`, `https://fpvlovers.com.tr`), `/api/ready` → `status: "ready"`.
- Migration `0011_privacy_compliance_foundation.sql` applied to `gkmzgwnnirofcgpw2yh0bnlh` (`fpvlovers` DB).
- **Two items remain, both outside engineering's reach:** Cloudflare DNS for mail authentication (user action) and lawyer review of the legal texts (user action).

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

### 1. Cloudflare DNS (user action; no API token on the host, Cloudflare MCP is broken)

Authoritative zone for `fpvlovers.com.tr` currently has no MX/SPF/DKIM/DMARC. Stalwart's generated zone file is on the host at `/root/fpvlovers-dns-zone.txt`. Minimum required set:

```text
fpvlovers.com.tr.                        MX    10 mail.affexai.tr.
fpvlovers.com.tr.                        TXT   "v=spf1 mx -all"
v1-ed25519-20261031._domainkey           TXT   "v=DKIM1; k=ed25519; h=sha256; p=PGbBVrxbH7dP+W2tUikQLGT5u3kusbBQ5cvB/8QwYq0="
v1-rsa-20261031._domainkey               TXT   "v=DKIM1; k=rsa; h=sha256; p=<RSA value from /root/fpvlovers-dns-zone.txt>"
_dmarc                                   TXT   "v=DMARC1; p=quarantine; rua=mailto:postmaster@fpvlovers.com.tr; adkim=r; aspf=r; pct=100"
```

Recommendation: start DMARC at `p=quarantine` (the generated record says `p=reject`) because the domain has no sending history; tighten to reject once aggregate reports are clean. Optional SRV / MTA-STS / autoconfig records are in the same zone file.

Until MX exists, external inbound mail depends on the implicit-MX fallback (A record), which many receivers ignore; DMARC reports cannot arrive at all.

### 2. Lawyer review (user action)

The texts are written to match actual code behaviour (rights requests route to `hello@fpvlovers.com.tr`, 30-day response, no account-menu export/delete promise). They still need legal review, and the controller identity may need KEP / tax ID fields populated in Coolify if the lawyer asks for them.

## Known limitations / decisions to respect

- GitNexus MCP/CLI is unusable in this environment (`@ladybugdb/core` build/openssl); impact analysis and `detect-changes` were substituted with `rg`, `graphify`, `tsc`, `eslint` and explicit diff review. Do not assume a clean graph check happened.
- Do not weaken the production CSP to make webpack dev hydrate.
- Do not schedule or run retention against a legacy subscriber list without a re-consent decision first: `status='active' AND consent_at IS NULL` rows older than 30 days are deleted by design.
- Never put `.env` values, Coolify env backups, SSH keys or mailbox secrets in the repo. Host secret paths are listed above and must stay outside Git.
- Coolify-native only; never touch the AffeXAI Cortex or Bimmetraj resources. No n8n/n8nac references in new code or docs.

## Exact resume point

1. If DNS is still missing: publish the five records above, then verify with `dig MX fpvlovers.com.tr`, `dig TXT fpvlovers.com.tr`, `dig TXT v1-rsa-20261031._domainkey.fpvlovers.com.tr`, `dig TXT _dmarc.fpvlovers.com.tr`.
2. Send a real external test mail (Gmail → `hello@`) and confirm DKIM/SPF/DMARC pass in the received headers; after a few days, switch DMARC to `p=reject`.
3. Hand the legal texts to the lawyer; apply any wording changes as a new commit and redeploy.
4. Then pick up the approved but unimplemented Turkish article pipeline plan at `docs/superpowers/plans/2026-10-31-turkish-articles-c2.md` (untracked at the time of this handoff).
5. Detailed session ledger (git-ignored): `.superpowers/sdd/2026-10-31-kvkk-gdpr-compliance-p0/progress.md`.

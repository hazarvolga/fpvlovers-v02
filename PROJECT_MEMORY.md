# FPVLovers Project Memory

Last updated: 2026-05-17

## Current Product Direction

FPVLovers is a Next.js 15 / React 19 frontend and admin platform for FPV drone content, RAG-assisted tools, crawler ingestion, and trust-first monetization.

The current MVP architecture is intentionally simple:

```text
Frontend / Admin Panel
  -> Next.js API Routes
  -> Crawler provider
  -> Dify API
  -> RAG datasets / content generation / admin views
```

n8n is not part of the active MVP flow. It can stay available as an optional automation layer for future batch jobs, sheets, webhooks, reports, or experiments, but the production path should use Dify plus crawler directly.

## Active Deployment Target

- Primary hosting target: Coolify on Oracle Cloud Free Tier VPS.
- Active frontend repo: `hazarvolga/fpvlovers.com.tr`
- Coolify app target: the existing FPVLovers frontend application on the `fpv-lovers-web-sitesi` project.
- Runtime port: `3000`.
- Preferred app root: repository root with `Dockerfile`.

## Current Known State

- Local build and TypeScript were stabilized in this workspace after prior Coolify failures.
- Coolify's last remote deploy failed because the remote repository still had a broken `app/admin/page.tsx` TSX structure.
- The active domain `fpvlovers.com.tr` resolves to the crawler/frontend host, but the app is not currently serving the domain.
- Public domain binding still needs to be attached to the frontend application in Coolify.

## Current Architecture Decisions

- Use Dify v1.14 as the LLMOps/RAG backend.
- Use crawler providers directly from Next.js server-side API routes.
- Keep n8n out of the active launch path.
- Use 9 RAG datasets, including `fpv-regulations`.
- Keep secrets in Coolify env / private operations storage, not in committed source.
- Admin routes must fail closed if required credentials are missing.
- User-facing AI/product recommendations should be trust-first and intent-aware.

## RAG Dataset Set

Canonical dataset keys for the frontend:

- `fpv-flight-tuning`
- `fpv-pid-profiles`
- `fpv-troubleshooting`
- `fpv-components-specs`
- `fpv-build-guides`
- `fpv-news-reviews`
- `fpv-racing-events`
- `fpv-community-knowledge`
- `fpv-regulations`

`fpv-regulations` should be treated as safety-sensitive. Do not hallucinate SHY/SHGM/EASA/legal details without RAG-backed evidence.

## Monetization Direction

The site should avoid aggressive ad placement. Use intent-aware density:

- Informational/troubleshooting/regulations: low density, soft recommendations.
- Commercial comparison pages: stronger product modules and affiliate CTAs.
- AI answer/tool results: include confidence, reasoning, use-case fit, and source alignment.

Affiliate links should use `rel="nofollow sponsored"` where applicable.

## Important Safety Rules

- Do not commit `.env`, private keys, cookies, credentials, or server backup env files.
- Do not log API keys, admin passwords, DB passwords, private SSH key contents, or cookies.
- Do not expose internal prompts, admin tokens, embeddings, or Dify keys to the browser.
- Keep crawler/Dify calls server-side unless a value is intentionally public.

## Where To Resume

If work is interrupted, resume from `NEXT_ACTIONS.md`, then check:

1. `DEPLOYMENT_RUNBOOK.md`
2. `DECISIONS.md`
3. private operations notes under the repository sibling `sunucular/`

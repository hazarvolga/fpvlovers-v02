# FPVLovers Decisions

Last updated: 2026-05-17

## ADR-001: n8n Is Not In The Active MVP Path

Status: Accepted

Decision:
Use Dify and crawler providers directly from the Next.js backend. Keep n8n available for future automation, but do not make it a dependency for launch.

Reason:
The active product path is simpler, cheaper to operate, easier to debug, and has fewer failure points:

```text
Next.js API -> Crawler -> Dify
```

Impact:

- Admin ingestion should call crawler and Dify through server-side routes.
- n8n workflow docs remain useful as future reference only.
- Deploy readiness should not depend on n8n.

## ADR-002: Coolify On Oracle VPS Is The Production Target

Status: Accepted

Decision:
Deploy the frontend through Coolify using the existing Dockerfile-based application.

Reason:
This matches the broader infrastructure strategy and keeps cost low. Vercel can still be used later for preview deployments if needed.

Impact:

- Dockerfile must produce a standalone Next.js app.
- Health checks should target `/api/health`.
- Required env vars must exist in Coolify.

## ADR-003: Dify + Crawler Server-Side Integration

Status: Accepted

Decision:
Do not call private Dify or crawler APIs from the browser. Frontend UI should call Next.js API routes, and those routes should call Dify/crawler services.

Reason:
This protects API keys, allows request validation/rate limiting, and keeps deployment routing stable.

Impact:

- Secrets live in Coolify env.
- Admin API routes require Basic Auth.
- Public components can only use intentionally public env vars.

## ADR-004: 9 Dataset Canonical Model

Status: Accepted

Decision:
Treat `fpv-regulations` as part of the canonical dataset set, making the current model 9 datasets rather than 8.

Reason:
Regulations/legal content has different safety requirements and should not be mixed into general community or build-guide retrieval.

Impact:

- Routing tables must include `fpv-regulations`.
- Dify dataset IDs must be corrected everywhere.
- Legal/regulatory answers must be conservative and source-backed.

## ADR-005: Trust-First Monetization

Status: Accepted

Decision:
Use intent-aware affiliate/sponsor placement instead of generic aggressive ads.

Reason:
FPV users need technical trust. Bad recommendations harm the product and reduce long-term monetization.

Impact:

- Commercial pages can use stronger CTAs.
- Troubleshooting/regulation pages should use low-density soft placements.
- AI product recommendations need confidence and reasoning.

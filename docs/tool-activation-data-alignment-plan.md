# FPVLovers Tool Activation Data Alignment Plan

Last updated: 2026-05-29

## Current Crawler State

- Crawl4AI Primary B: `http://161.118.171.201:3002/health`
- Crawl4AI Backup C: `http://141.148.206.187/c4ai/health`
- Admin health now reports checked URL, status/error, version, and latency.
- If Primary B is down and Backup C is healthy, admin should show fallback mode instead of a generic degraded state.

## Activation Order

Flight Critic is intentionally deferred for now. The current execution focus is:

1. Stabilize Dify-backed tool routes so Build Wizard, Part Matcher, Hardware Analyzer, and Blackbox return fast deterministic fallbacks when Dify is slow or unavailable.
2. Replace the MVP 15-product local catalog with crawler/source-backed product specs, real product images, and source provenance.
3. Use the expanded catalog as the single data source for Part Matcher, Component Duel, affiliate placement, and hardware analysis.

### Phase 1 - Build Calculator

Goal: make `/tools/calculator` useful without waiting for Dify.

Data needed:
- frame weight
- battery cell count, capacity, weight
- motor KV range
- prop size/pitch
- estimated thrust table

Implementation alignment:
- local deterministic calculator module
- server-safe formula tests
- optional product suggestions from `data/affiliates.json`

Crawler priority:
- `fpv-components-specs`
- `fpv-build-guides`

MVP exit:
- calculator updates AUW, thrust-to-weight, estimated flight time, safe KV range, and warning states.

### Phase 2 - Component Duel / Part Matcher

Goal: connect comparisons and compatibility checks to broad real catalog data, not the current MVP seed catalog.

Data needed:
- normalized product catalog
- component type, brand, model, specs, source URL
- affiliate URL and sponsor mapping
- review/reputation snippets
- real source image URL or stored local media reference
- crawl provenance: source page, crawled_at, extraction confidence

Implementation alignment:
- one shared catalog schema
- `/tools/component-duel` uses the same product source as `/tools/part-matcher`
- Dify Part Matcher workflow imported and wrapped through `src/lib/dify-client.ts`
- `npm run tools:audit` reports catalog size, image coverage, Dify wiring, and deferred/offline tools
- `data/fpv-product-source-pack.json` lists crawler-ready retailer/manufacturer source URLs for product/spec/image expansion
- `npm run catalog:sources` previews the source pack; `npm run catalog:enqueue` enqueues those URLs through `src/lib/crawl-queue.ts`
- Dify responses are sanitized before UI rendering and tool routes use short timeouts with local fallbacks

Crawler priority:
- `fpv-components-specs`
- `fpv-build-guides`
- `fpv-news-reviews`

MVP exit:
- at least 50 source-backed active products across frame, motor, prop, stack, battery, video, receiver, goggles, radio, and kit
- at least 80% of active products have non-placeholder image references
- two real same-type products can be selected and compared without placeholder images/data

### Phase 3 - Blackbox Tuning

Goal: move tuning analysis from client-side Gemini calls to a guarded server route.

Data needed:
- Betaflight docs
- PID/filter references
- ESC/RPM filtering docs
- blackbox sample summaries

Implementation alignment:
- server API for tune analysis
- upload/text path supports `.bbl`, `.bfl`, `.csv`, `.log`, and CLI dumps
- Dify HD Tune Analyzer workflow imported and routed through guarded client

Crawler priority:
- `fpv-flight-tuning`
- `fpv-pid-profiles`
- `fpv-troubleshooting`

MVP exit:
- generated advice includes confidence, risk level, suggested PID/filter changes, and motor heat caution.

### Phase 4 - Flight Critic (Deferred)

Goal: connect `/tools/flight-critic` to the existing upload analysis path.

Data needed:
- scoring rubric
- maneuver labels
- example feedback patterns

Implementation alignment:
- use server-side `/api/analyze-flight`
- remove disabled offline UI
- cap upload size and add clear analysis status

Crawler priority:
- optional only; this tool primarily needs video AI and rubric data.

MVP exit:
- user can upload video and receive scorecard, verdict, summary, and event timeline.

Current status:
- Deferred until catalog-backed product tools are live.
- Do not market this as true frame-level video/DVR analysis before a dedicated Dify video/telemetry workflow exists.

### Phase 5 - Pilot Pulse

Goal: replace mock news with a real FPV radar feed.

Data needed:
- news/release/event feed
- source URL
- publish date
- product/event entity extraction
- real `og:image` or scraped image URL

Implementation alignment:
- scheduled crawler job
- dedupe by URL/title hash
- media resolver must prefer original source images for news/product posts

Crawler priority:
- `fpv-news-reviews`
- `fpv-racing-events`
- `fpv-community-knowledge`

MVP exit:
- feed contains recent, sourced, dated items with distinct real images and impact scores.

## Crawl Execution Rules

- Use Backup C while Primary B is down.
- Keep `CRAWL_DRY_RUN=true` for route/queue tests.
- Start with batches of 3 URLs.
- Prefer source packs already mapped in `data/fpv-rag-source-pack.json`.
- Do not ingest sources unless the target dataset is explicit.
- Do not show a tool as production-ready until its primary dataset has usable completed documents or the tool is deterministic and local.

## Verification Gates

- `npx tsc --noEmit`
- `npm run tools:audit`
- `/api/admin/crawlers` returns checked URL, status, latency, and fallback state
- `/api/admin/health` shows crawler details in service list
- crawl queue contains only dataset-routed jobs
- retrieval smoke returns non-simulated resources before Dify-backed tools are labeled live

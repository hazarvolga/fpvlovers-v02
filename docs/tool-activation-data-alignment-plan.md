# FPVLovers Tool Activation Data Alignment Plan

Last updated: 2026-05-29

## Current Crawler State

- Crawl4AI Primary B: `http://161.118.171.201:3002/health`
- Crawl4AI Backup C: `http://141.148.206.187/c4ai/health`
- Admin health now reports checked URL, status/error, version, and latency.
- If Primary B is down and Backup C is healthy, admin should show fallback mode instead of a generic degraded state.

## Activation Order

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

Goal: connect comparisons and compatibility checks to real catalog data.

Data needed:
- normalized product catalog
- component type, brand, model, specs, source URL
- affiliate URL and sponsor mapping
- review/reputation snippets

Implementation alignment:
- one shared catalog schema
- `/tools/component-duel` uses the same product source as `/tools/part-matcher`
- Dify Part Matcher workflow imported and wrapped through `src/lib/dify-client.ts`

Crawler priority:
- `fpv-components-specs`
- `fpv-build-guides`
- `fpv-news-reviews`

MVP exit:
- two real products can be selected and compared without placeholder images/data.

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

### Phase 4 - Flight Critic

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
- `/api/admin/crawlers` returns checked URL, status, latency, and fallback state
- `/api/admin/health` shows crawler details in service list
- crawl queue contains only dataset-routed jobs
- retrieval smoke returns non-simulated resources before Dify-backed tools are labeled live

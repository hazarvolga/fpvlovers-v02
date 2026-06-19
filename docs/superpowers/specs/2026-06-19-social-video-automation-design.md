# Social and Video Automation Design

Date: 2026-06-19
Status: Approved
Dependency: Affiliate editorial governance must be verified first.

## Objective

Turn approved FPVLovers facts into credible platform-native social content and short videos without letting an LLM invent product experience, pricing, events, sponsor relationships, or performance claims.

## Architecture

```text
Published artifact + editorial metadata
  -> deterministic fact pack
  -> Dify social/video director
  -> validated JSON manifest
  -> platform copy jobs + render job
  -> HyperFrames / FFmpeg / TTS
  -> automated QA
  -> private YouTube upload or scheduled social queue
  -> approval when review/sponsor policy requires it
```

Dify chooses narrative structure, hook, scene order, captions, and CTA. Application code owns source facts, disclosure rules, schema validation, duration limits, asset allowlists, rendering, upload privacy, logs, retries, and idempotency.

## Approval Rules

- Product-review video: Hazar Volga Ekiz approval required.
- Sponsored or supplied-product video: human approval and clear disclosure required.
- Educational, tutorial, news-summary, comparison, and buyer-guide video: autonomous after source and automated QA gates, unless it introduces first-hand claims.
- YouTube uploads default to `private`; public transition is separate and auditable.

## Platform System

- Facebook: useful article summaries, questions, event context, and transparent links.
- Instagram: Reels/carousels with strong visual hierarchy and concise technical captions.
- YouTube Shorts: 30-60 second sourced explainers with captions and a single learning outcome.
- TikTok: fast technical demonstrations/explainers without exaggerated influencer language.
- X: compact findings, threads, diagrams, and timely source-linked updates.
- Reddit: community-first text posts that answer a real question before linking; no disguised promotion.
- LinkedIn: engineering, autonomous publishing governance, creator operations, and sponsor-safe business updates.

## Video Manifest Minimum

The manifest contains source artifact ID, content class, approval policy, fact IDs, aspect ratio, target duration, scenes, narration, on-screen text, asset references, music policy, captions, CTA, disclosures, synthetic-media flag, paid-product-placement flag, and upload visibility.

Every factual sentence maps to an allowed fact ID. Unsupported manifest claims fail validation instead of being softened after rendering.

## MVP

Render one 45-second English vertical Short on `DJI O3 vs Walksnail`. It is a sourced comparison, not a hands-on review, unless test evidence is later attached. Output includes burned-in captions, disclosure-safe CTA, render manifest, QA report, and a private upload payload.

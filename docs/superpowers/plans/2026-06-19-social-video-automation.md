# Social and Video Automation Implementation Plan

Date: 2026-06-19
Design: `docs/superpowers/specs/2026-06-19-social-video-automation-design.md`

## Entry Gate

Do not begin implementation until the product-review publication boundary and truthful public disclosures pass their affiliate verification suite.

## Phase 1 - Social contracts

1. Add strict social job, platform variant, fact pack, and disclosure types under `src/lib/social/`.
2. Add deterministic article-to-fact-pack extraction and per-platform copy constraints.
3. Add regression tests for unsupported claims, missing disclosures, Reddit link-first promotion, duplicate jobs, and product-review approval inheritance.
4. Add an admin API for dry-run job generation and status inspection.

Verification: social contract tests, route audit, TypeScript.

## Phase 2 - Dify video director

1. Extend the guarded `src/lib/dify-client.ts` task taxonomy for video direction without creating a second Dify client.
2. Add `src/lib/video/video-manifest.ts` and `src/lib/video/video-director.ts` with strict JSON validation and fact-ID enforcement.
3. Add a dry-run fixture and regression tests for duration, scene timing, asset allowlist, captions, disclosures, synthetic-media metadata, and private upload visibility.
4. Store manifests and job state idempotently with retry-safe identifiers.

Verification: manifest tests, Dify dry-run smoke, TypeScript.

## Phase 3 - Rendering and publishing boundary

1. Build a reusable vertical Short composition using HyperFrames, FFmpeg, and a configurable TTS adapter.
2. Add deterministic caption timing, brand-safe music rules, local/approved asset resolution, and render diagnostics.
3. Add a YouTube OAuth upload adapter that defaults to private and carries synthetic-media and paid-product-placement metadata when applicable.
4. Keep live upload disabled unless credentials and an explicit runtime flag exist.

Verification: composition lint/inspect, local render, ffprobe duration/dimensions/audio checks, private upload payload test.

## Phase 4 - 45-second MVP

1. Build a fact pack from the approved DJI O3 versus Walksnail source article(s).
2. Generate and validate the English manifest through Dify or a dry-run fixture when Dify is unavailable.
3. Render the MP4, captions, thumbnail frame, manifest, and QA report.
4. Review the result in a browser/local player and preserve it as a local artifact; do not publish publicly during implementation.

Verification: 1080x1920 output, 40-50 second duration, captions inside safe areas, no unsupported hands-on claim, no unlicensed asset.

## Operations and Cost

- Cache manifests and TTS by content hash.
- Render only approved/final manifests.
- Use short clips and deterministic templates before considering generative video models.
- Record model, token, TTS, render time, and upload outcomes per job.
- Keep product-review and sponsor approvals auditable.

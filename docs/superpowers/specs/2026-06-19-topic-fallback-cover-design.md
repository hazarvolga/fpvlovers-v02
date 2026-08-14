# Topic-Aware Fallback Cover Design

**Date:** 2026-06-19

**Status:** Implemented; routing refinement active as of 2026-08-14

## Objective

Replace the single repeated fallback cover with deterministic premium, photorealistic FPVLovers topic families and article-stable variants. The system must retain a valid article-specific cover and use a local topic cover only when the original is missing or fails to load.

This is a resilience and visual-quality improvement. It does not add a route, section, service, or new content system.

## Scope

In scope:

- Twelve locally stored topic-family images.
- Eight locally stored high-frequency topic variants selected semantically, then by stable slug hash.
- One generic local FPVLovers cover as the final safety net.
- One shared resolver for homepage cards and article covers.
- Metadata-driven topic selection.
- Prevention of unrelated section images replacing explicit article covers.
- Regression tests for topic mapping and fallback behavior.
- Local and production browser verification.

Out of scope:

- Redesigning cards or article layouts.
- Generating a unique cover for every article.
- Runtime image generation.
- New API routes or proxy services.
- Mutating published artifacts or PostgreSQL records during page render.
- Brand-specific or trademarked product imagery.

## Visual Direction

All fallback assets use a shared editorial language:

- Photorealistic commercial product photography.
- Cockpit-black and charcoal studio/workbench environment.
- Restrained `#FF5C00` orange and `#00F2FF` cyan rim lighting.
- Realistic carbon fiber, aluminum, wiring, electronics, and polymer surfaces.
- Landscape 16:10 master composition that remains safe at 16:9 and square crops.
- No text, logo, watermark, UI overlay, pilot, weapon, fantasy part, or brand mark.
- No cartoon, generic stock illustration, or excessive cyberpunk treatment.
- Technically plausible FPV geometry with exactly four arms, motors, and propeller positions when a complete quad is shown.

## Topic Families and Art Briefs

| Key | Family | Photorealistic scene |
|---|---|---|
| `racing` | Racing & Events | Compact racing quad staged near a race gate with restrained event lighting. |
| `freestyle` | Freestyle Flight | Used but well-maintained five-inch freestyle quad with realistic wear. |
| `cinematic-long-range` | Cinematic & Long Range | Long-range quad with GPS and long antennas in a clean product setup. |
| `academy-beginner` | Academy & Beginner | Ordered starter kit containing a small quad, radio, and goggles. |
| `build-workshop` | Build & Workshop | Partially assembled quad on an ESD-safe soldering bench. |
| `tuning-betaflight` | Tuning & Betaflight | Quad connected for Blackbox analysis with an out-of-focus telemetry display. |
| `motors-propulsion` | Motors & Propulsion | Macro product arrangement of a motor and correctly mounted propeller. |
| `power-battery-esc` | Power, ESC & Batteries | Safe bench arrangement of a LiPo, ESC, XT60 connector, and power hardware. |
| `video-goggles-vtx` | Video, VTX & Goggles | FPV goggles, VTX, antennas, and FPV camera in a balanced studio layout. |
| `radio-elrs-gps` | Radio, ELRS & GPS | Generic radio controller, ELRS receiver, antennas, and GPS module. |
| `commercial` | Reviews, Comparisons & Buyer Guides | Neutral comparison table with two distinct generic FPV products. |
| `safety-regulations` | Troubleshooting, Safety & Regulations | Propeller-free quad, LiPo safety bag, inspection tools, and checklist-like physical props without readable text. |

The existing generic FPV studio cover is the thirteenth asset and final fallback.

## Resolution Strategy

The resolver applies the following precedence:

1. Use an explicit article cover when its image loads successfully.
2. On missing source or load failure, resolve a family from `metadata.components`.
3. If no component matches, inspect `metadata.topics` and `metadata.discipline`.
4. If no topic or discipline matches, inspect `category` and `metadata.contentType`.
5. If no family matches or the family asset fails, use the generic FPVLovers fallback.

Selection is deterministic. The same article metadata always resolves to the same local asset.

## Mapping Rules

The resolver uses ordered matching. Earlier matches win.

| Signal | Matching values | Family |
|---|---|---|
| `contentType` | `review`, `comparison`, `buyer-guide`, `product-roundup` | `commercial` |
| `category` or `discipline` | `Racing`, `racing` | `racing` |
| `discipline` or topic | `freestyle` | `freestyle` |
| `discipline` | `cinematic`, `long-range` | `cinematic-long-range` |
| category or topic | `Academy`, `beginner`, `simulators` | `academy-beginner` |
| category or topic | `Build Guides`, `soldering`, `wiring`, `workshop` | `build-workshop` |
| category or topic | `Flight Control`, `betaflight`, `tuning`, `blackbox` | `tuning-betaflight` |
| component or category | `motor`, `motors`, `propulsion`, `propeller` | `motors-propulsion` |
| component or topic | `esc`, `battery`, `batteries`, `power` | `power-battery-esc` |
| component or topic | `goggles`, `vtx`, `camera`, `video`, `digital-video`, `analog-video` | `video-goggles-vtx` |
| component or topic | `radio`, `gps`, `elrs`, `communication` | `radio-elrs-gps` |
| category or topic | `Troubleshooting`, `Regulations`, `troubleshooting`, `regulations`, `safety` | `safety-regulations` |

An explicit commercial `contentType` takes precedence because a review/comparison/buyer guide should look commercially distinct even when its subject is a radio or goggle.

## Data Flow

```text
Published artifact or database artifact
  -> existing content reader
  -> shared topic-family resolver
  -> article/homepage component receives original + fallback path
  -> browser loads original cover
       -> success: retain original
       -> error: switch once to local topic fallback
            -> error: switch once to generic fallback
```

The browser component must guard against an error loop. It may attempt the original, family fallback, and generic fallback at most once each.

## Cover-Promotion Rule

`ensureMediaArtifact()` must not replace an explicit article cover merely because a body section contains a matched product image.

A body-section image may become a cover only when:

- The artifact has no explicit `media.coverImage.src` and no legacy `coverImage` value.
- The match is relevant to the article title or explicit product metadata.
- The source is allowed by the existing media policy.

Otherwise, section matching remains section-only. This prevents an EP1 receiver or Zorro radio image from becoming the cover of an unrelated goggles, comparison, or racing article.

## Asset Layout

```text
public/images/fallbacks/
  fpv-generic.webp
  fpv-racing.webp
  fpv-freestyle.webp
  fpv-cinematic-long-range.webp
  fpv-academy-beginner.webp
  fpv-build-workshop.webp
  fpv-tuning-betaflight.webp
  fpv-motors-propulsion.webp
  fpv-power-battery-esc.webp
  fpv-video-goggles-vtx.webp
  fpv-radio-elrs-gps.webp
  fpv-commercial.webp
  fpv-safety-regulations.webp
  fpv-academy-stick-control.webp
  fpv-academy-simulator.webp
  fpv-build-soldering.webp
  fpv-tuning-blackbox.webp
  fpv-tuning-pid-filter.webp
  fpv-video-vtx-bench.webp
  fpv-video-goggles-camera.webp
  fpv-radio-elrs-gps-alt.webp
```

Masters may be retained as PNG source files outside the public runtime path if needed, but production-delivered files are optimized WebP assets.

## Error Handling

- Missing metadata resolves to `fpv-generic.webp`.
- Unknown metadata values do not throw.
- A failed original URL triggers the family fallback without changing persisted content.
- A failed family fallback triggers the generic fallback.
- A failed generic fallback removes the image surface gracefully rather than looping requests.
- The resolver remains server-safe and performs no browser or network access.

## Verification

### Automated tests

- Every mapping rule resolves to the expected family.
- Commercial content takes precedence over component matches.
- Unknown or empty metadata resolves to generic.
- Explicit covers are preserved by the content reader.
- Unrelated section images cannot replace explicit covers.
- Error transitions are limited to original → family → generic.
- All thirteen public assets exist and are readable.

### Visual QA

- Inspect homepage Recent Posts, Featured Guides, commercial hubs, and representative article pages.
- Confirm broken vendor URLs switch to the correct family image.
- Confirm working covers remain unchanged.
- Check 16:10 desktop cards, mobile cards, article hero, and square crop behavior.
- Confirm no subject is visibly malformed, branded, or category-inappropriate.
- Confirm no relevant browser console errors.

### Production gate

- Run the fastest targeted regression tests.
- Run TypeScript, lint, media audit, and production build.
- Deploy through the existing Coolify path.
- Record deployed commit.
- Live-verify the six currently broken Recent Posts covers and at least one working original cover.

## Success Criteria

- No blank image area remains when a remote cover fails.
- No unrelated section image is promoted to an explicit article cover.
- Twelve topic families are visibly distinct but share one FPVLovers art direction.
- Repeated generic imagery is limited to metadata that cannot be classified.
- Homepage and article pages use the same deterministic resolution behavior.
- The change adds no new route, service, runtime generation, or architectural subsystem.

# FPVLovers Media Selection Audit V1

**Date:** 2026-08-14
**Scope:** 163 repository-published artifacts
**Mode:** Read-only artifact analysis; no database, cache, or production mutation

## Operational note

Coolify deployment `acgkgw448owok40g0cco4c04` failed during the Next.js production build on 2026-08-14. Coolify removed the new version and the previously running live version remained active. This audit therefore separates repository evidence from sampled live-page evidence.

## Cover inventory

| Cover class | Count | Share |
|---|---:|---:|
| external-hotlink | 82 | 50.3% |
| generated-svg | 42 | 25.8% |
| legacy-source-cache | 38 | 23.3% |
| missing | 1 | 0.6% |

## Risk flags

| Flag | Count | Share |
|---|---:|---:|
| no-url-source-hints | 124 | 76.1% |
| missing-cover-kind | 89 | 54.6% |
| external-hotlink | 82 | 50.3% |
| no-section-match | 53 | 32.5% |
| empty-gallery | 43 | 26.4% |
| generated-fallback | 42 | 25.8% |
| legacy-cache-path | 38 | 23.3% |
| technical-article-racing-cover | 3 | 1.8% |
| unproven-product-override | 1 | 0.6% |

## High-signal suspicious selections

| Slug | Category | Cover source | Flags |
|---|---|---|---|
| blackbox-analysis-masterclass | Flight Control | dronechampionsleague.com | no-url-source-hints, external-hotlink, missing-cover-kind, technical-article-racing-cover |
| expresslrs-binding-and-flashing-guide-step-by-step-for-edgetx-betaflight | Flight Guides | droneracing.fai.org | no-url-source-hints, external-hotlink, missing-cover-kind, technical-article-racing-cover |
| how-to-clean-and-maintain-your-fpv-drone-bearings-motors-and-electronics | Build Guides | dronechampionsleague.com | no-url-source-hints, external-hotlink, missing-cover-kind, technical-article-racing-cover |
| rf-link-engineering | Communication | RadioMaster | no-url-source-hints, external-hotlink, unproven-product-override |

## Reused cover sources

| Cover source | Articles |
|---|---:|
| https://judgeme.imgix.net/rotor-riot-store/1767477640__image_2026-01-03_170134848__original.png?auto=format&w=1024 | 2 |
| https://dronechampionsleague.com/wp-content/uploads/2025/12/DSC_4228-scaled.jpg | 2 |
| https://dronechampionsleague.com/wp-content/uploads/2025/12/DSC_4353-scaled.jpg | 2 |
| https://dronechampionsleague.com/wp-content/uploads/2025/12/Bildschirmfoto-2025-12-11-um-13.45.04-scaled.jpg | 2 |
| https://judgeme.imgix.net/rotor-riot/1767973806__img_4713__original.jpeg?auto=format&w=1024 | 2 |
| https://droneracing.fai.org/images/olymp2.png | 2 |
| https://droneracing.fai.org/images/games.png | 2 |
| https://dronechampionsleague.com/wp-content/uploads/2025/12/Superfinal-Thumb-16x9-1.jpg | 2 |
| https://judgeme.imgix.net/chinahobbyline/1779589215__img_0373__original.jpeg?auto=format&w=240 | 2 |
| https://www.multigp.com/wp-content/uploads/2025/09/DSC09520-1024x683.webp | 2 |
| https://dronechampionsleague.com/wp-content/uploads/2025/12/Bildschirmfoto-2025-12-11-um-13.48.21-scaled.jpg | 2 |
| https://www.multigp.com/wp-content/uploads/2025/10/10-10-25-2025-MultiGP-Champs-Photos-Photos-by-Patrick-Quiring-of-PQ-Multimedia-603-1024x577.webp | 2 |
| https://en.tmotor.com/uploadfile/2025/1209/20251209043748602.jpg | 2 |

## Interpretation

- A working cache endpoint does not prove media relevance.
- Cached media must be re-evaluated when the matcher version changes.
- Source-backed media needs a persisted score, selection reason, and matcher version.
- Attribution-only media must not be copied to self-hosted cache unless explicit reuse rights are proven.
- Generic runtime product overrides must require an exact product entity match.

## Required next gate

Run Matcher V2 in dry-run mode against this same artifact set and compare selected/rejected media before any production backfill.

# FPVLovers Media Source Policy

Last updated: 2026-06-14

## Policy

FPVLovers should use relevant images harvested from the original crawled FPV
source whenever provenance is available. External images are not rejected
merely because they are external.

Allowed sources:

- Images harvested from the crawled source article, with `sourceUrl`,
  hostname, attribution, and license classification preserved.
- Official manufacturer, vendor catalog, newsroom, press-kit, Wikimedia, and
  other positively identified open-license assets.
- Locally generated FPVLovers covers when no relevant source image is usable.

Blocked sources:

- Unsplash
- Pexels
- Picsum

These three providers are treated as generic stock fallbacks and must not enter
published artifacts or remain as runtime UI image URLs.

## Runtime Rules

1. `harvestImagesFromDatabase()` remains the source-image entry point.
2. `classifyImageLicenses()` records provenance and reuse constraints.
3. `isGenericStockImage()` removes only the blocked stock providers.
4. Relevant crawled FPV images take priority over the local generated cover.
5. Unverified source images remain attribution-only and are hotlinked; only
   positively open or press-kit assets may be self-hosted.
6. `npm run media:audit` must pass before release.

## Persistence

Published artifacts are written to `content/published/` and mirrored to
PostgreSQL `fpvlovers_app.published_articles_shadow` outside file-only mode.
Readers merge file and database artifacts so content generated in production
survives container replacement.

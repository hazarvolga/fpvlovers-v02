# Topic-Aware Fallback Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Use the `imagegen` skill for asset generation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce twelve photorealistic topic-family covers plus one generic cover, fix false product-image matching, and use deterministic local fallbacks on homepage and article pages.

**Architecture:** A pure metadata resolver maps an artifact to one of twelve local WebP assets. Client cover components attempt the original source, then the topic fallback, then the generic fallback; rendering never mutates persisted content. Explicit article covers remain authoritative, and body-section image matching cannot promote unrelated hardware into the cover slot.

**Tech Stack:** Next.js 15, React 19, TypeScript, `next/image`, built-in ImageGen, `cwebp`, existing content artifacts and metadata.

---

## File Map

- Create `src/lib/content-automation/fallback-cover.ts`: topic-family types, ordered mapping rules, and public asset paths.
- Create `scripts/topic-fallback-cover-regression-test.ts`: executable resolver, cover-preservation, asset-existence, and false-match regression tests.
- Create `src/features/content/components/ResilientCardCover.tsx`: original → topic → generic error sequence for cards.
- Modify `src/features/content/components/ResilientArticleCover.tsx`: accept topic fallback and use the same three-state sequence.
- Modify `src/lib/content-automation/content-reader.ts`: preserve explicit covers and remove unsafe substring promotion.
- Modify `src/lib/homepage/homepage-content.ts`: attach resolved fallback path to each homepage card.
- Modify `src/app/page.tsx`: render card images through `ResilientCardCover`.
- Modify `src/app/article/[slug]/page.tsx`: pass resolved topic fallback to `ResilientArticleCover`.
- Modify `scripts/article-cover-fallback-regression-test.mjs`: require topic and generic fallback wiring on both surfaces.
- Modify `package.json`: add `content:topic-cover-test`.
- Create thirteen runtime assets under `public/images/fallbacks/*.webp`.

## Task 1: Lock the Matching Bug Behind Failing Tests

**Files:**

- Create: `scripts/topic-fallback-cover-regression-test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the test command**

```json
"content:topic-cover-test": "node --import tsx scripts/topic-fallback-cover-regression-test.ts"
```

- [ ] **Step 2: Write the failing resolver and cover-preservation tests**

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensureMediaArtifact } from '@/lib/content-automation/content-reader';
import {
  FALLBACK_COVER_PATHS,
  resolveFallbackCover,
} from '@/lib/content-automation/fallback-cover';

assert.equal(resolveFallbackCover({ category: 'Racing', metadata: { contentType: 'news' } }), FALLBACK_COVER_PATHS.racing);
assert.equal(resolveFallbackCover({ category: 'Reviews', metadata: { contentType: 'review', components: ['radio'] } }), FALLBACK_COVER_PATHS.commercial);
assert.equal(resolveFallbackCover({ category: 'Unknown', metadata: undefined }), FALLBACK_COVER_PATHS.generic);

const explicitCover = 'https://example.com/racing-cover.jpg';
const artifact = ensureMediaArtifact({
  slug: 'street-league-test',
  title: 'Street League Spec: Upcoming Races Section Currently Empty',
  category: 'Racing',
  coverImage: explicitCover,
  bodySections: [{ id: 'body', title: 'Races', content: 'No races are currently listed.' }],
});
assert.equal(artifact?.media?.coverImage.src, explicitCover);
assert.notEqual(artifact?.media?.coverImage.alt, 'BETAFPV ELRS Lite 2.4GHz Receiver');

for (const path of Object.values(FALLBACK_COVER_PATHS)) {
  assert.equal(fs.existsSync(`public${path}`), true, `missing fallback asset: ${path}`);
}
```

- [ ] **Step 3: Run the test and confirm it fails before implementation**

Run: `pnpm content:topic-cover-test`

Expected: FAIL because `fallback-cover.ts` and the thirteen WebP assets do not exist.

- [ ] **Step 4: Commit the red test only**

```bash
git add package.json scripts/topic-fallback-cover-regression-test.ts
git commit -m "test(content): define topic cover fallback contract"
```

## Task 2: Implement the Pure Topic Resolver

**Files:**

- Create: `src/lib/content-automation/fallback-cover.ts`
- Test: `scripts/topic-fallback-cover-regression-test.ts`

- [ ] **Step 1: Define family keys and paths**

```ts
import type { ContentMetadata } from '@/lib/content-metadata';

export type FallbackCoverFamily =
  | 'racing'
  | 'freestyle'
  | 'cinematic-long-range'
  | 'academy-beginner'
  | 'build-workshop'
  | 'tuning-betaflight'
  | 'motors-propulsion'
  | 'power-battery-esc'
  | 'video-goggles-vtx'
  | 'radio-elrs-gps'
  | 'commercial'
  | 'safety-regulations'
  | 'generic';

export const FALLBACK_COVER_PATHS: Record<FallbackCoverFamily, string> = {
  racing: '/images/fallbacks/fpv-racing.webp',
  freestyle: '/images/fallbacks/fpv-freestyle.webp',
  'cinematic-long-range': '/images/fallbacks/fpv-cinematic-long-range.webp',
  'academy-beginner': '/images/fallbacks/fpv-academy-beginner.webp',
  'build-workshop': '/images/fallbacks/fpv-build-workshop.webp',
  'tuning-betaflight': '/images/fallbacks/fpv-tuning-betaflight.webp',
  'motors-propulsion': '/images/fallbacks/fpv-motors-propulsion.webp',
  'power-battery-esc': '/images/fallbacks/fpv-power-battery-esc.webp',
  'video-goggles-vtx': '/images/fallbacks/fpv-video-goggles-vtx.webp',
  'radio-elrs-gps': '/images/fallbacks/fpv-radio-elrs-gps.webp',
  commercial: '/images/fallbacks/fpv-commercial.webp',
  'safety-regulations': '/images/fallbacks/fpv-safety-regulations.webp',
  generic: '/images/fallbacks/fpv-generic.webp',
};
```

- [ ] **Step 2: Add ordered metadata matching**

```ts
type FallbackCoverInput = {
  category?: string;
  metadata?: ContentMetadata;
};

const normalise = (values: Array<string | undefined>): string[] =>
  values.filter((value): value is string => Boolean(value)).map((value) => value.trim().toLowerCase());

const containsAny = (values: string[], candidates: string[]): boolean =>
  candidates.some((candidate) => values.includes(candidate));

export function resolveFallbackCover({ category, metadata }: FallbackCoverInput): string {
  const contentType = metadata?.contentType?.toLowerCase();
  if (contentType && ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(contentType)) {
    return FALLBACK_COVER_PATHS.commercial;
  }

  const values = normalise([
    category,
    ...(metadata?.components ?? []),
    ...(metadata?.topics ?? []),
    ...(metadata?.discipline ?? []),
  ]);

  const rules: Array<[string[], FallbackCoverFamily]> = [
    [['racing'], 'racing'],
    [['freestyle'], 'freestyle'],
    [['cinematic', 'long-range'], 'cinematic-long-range'],
    [['academy', 'beginner', 'simulators'], 'academy-beginner'],
    [['build guides', 'soldering', 'wiring', 'workshop'], 'build-workshop'],
    [['flight control', 'betaflight', 'tuning', 'blackbox'], 'tuning-betaflight'],
    [['motor', 'motors', 'propulsion', 'propeller'], 'motors-propulsion'],
    [['esc', 'battery', 'batteries', 'power'], 'power-battery-esc'],
    [['goggles', 'vtx', 'camera', 'video', 'digital-video', 'analog-video'], 'video-goggles-vtx'],
    [['radio', 'gps', 'elrs', 'communication'], 'radio-elrs-gps'],
    [['troubleshooting', 'regulations', 'safety'], 'safety-regulations'],
  ];

  return FALLBACK_COVER_PATHS[rules.find(([terms]) => containsAny(values, terms))?.[1] ?? 'generic'];
}
```

- [ ] **Step 3: Run TypeScript and confirm only the asset-existence assertions remain red**

Run: `pnpm exec tsc --noEmit && pnpm content:topic-cover-test`

Expected: TypeScript PASS; test FAIL listing missing WebP assets.

- [ ] **Step 4: Commit the resolver**

```bash
git add src/lib/content-automation/fallback-cover.ts
git commit -m "feat(content): resolve topic fallback covers"
```

## Task 3: Generate and Optimize the Thirteen Assets

**Files:**

- Create: `public/images/fallbacks/fpv-generic.webp`
- Create: twelve topic WebP files named in `FALLBACK_COVER_PATHS`

- [ ] **Step 1: Convert the approved generic source**

Run:

```bash
cwebp -quiet -q 88 public/images/fallbacks/fpv-editorial-fallback.png -o public/images/fallbacks/fpv-generic.webp
```

Expected: a readable WebP with the same 1568×1003 composition.

- [ ] **Step 2: Generate each topic asset with built-in ImageGen**

Use one ImageGen call per family. Every prompt must include this shared suffix:

```text
Photorealistic high-end FPV editorial product photography on a matte cockpit-black technical workbench. Restrained #FF5C00 orange rim light and subtle #00F2FF cyan rim light. Landscape 16:10, crop-safe for 16:9 and square. Generic unbranded hardware. No text, logo, watermark, pilot, weapon, fantasy part, cartoon rendering, excessive cyberpunk glow, or malformed quad geometry.
```

Use these subject lines:

1. `racing`: compact racing quad beside a realistic race gate.
2. `freestyle`: used but maintained five-inch freestyle quad with believable wear.
3. `cinematic-long-range`: long-range quad with GPS and long antennas.
4. `academy-beginner`: small beginner quad, generic radio, and goggles in an ordered kit.
5. `build-workshop`: partially assembled quad on an ESD-safe soldering bench.
6. `tuning-betaflight`: quad connected for Blackbox analysis with an unreadable blurred telemetry screen.
7. `motors-propulsion`: macro arrangement of one motor and correctly fitted propeller.
8. `power-battery-esc`: safe arrangement of LiPo, ESC, XT60, smoke stopper, and power hardware.
9. `video-goggles-vtx`: goggles, VTX, antennas, and FPV camera.
10. `radio-elrs-gps`: generic radio controller, ELRS receiver, antennas, and GPS module.
11. `commercial`: neutral comparison bench with two distinct generic FPV products.
12. `safety-regulations`: propeller-free quad, LiPo safety bag, inspection tools, and no readable checklist text.

- [ ] **Step 3: Inspect every generated PNG before accepting it**

Reject and regenerate any asset with extra motors, duplicated propellers, unreadable pseudo-text, branding, unsafe battery handling, incorrect connector geometry, or category ambiguity.

- [ ] **Step 4: Copy accepted PNGs into a non-runtime source directory**

Store accepted masters under `design-assets/fallback-covers/source/` with the same family filenames.

- [ ] **Step 5: Convert accepted masters to runtime WebP**

Run once per family:

```bash
cwebp -quiet -q 88 design-assets/fallback-covers/source/fpv-racing.png -o public/images/fallbacks/fpv-racing.webp
```

Repeat with the exact twelve filenames defined in `FALLBACK_COVER_PATHS`.

- [ ] **Step 6: Verify dimensions, format, and size**

Run:

```bash
file public/images/fallbacks/*.webp
du -h public/images/fallbacks/*.webp
pnpm content:topic-cover-test
```

Expected: thirteen readable WebP assets, no file larger than 500 KB, test still failing only if cover-preservation code has not yet been corrected.

- [ ] **Step 7: Commit only accepted assets**

```bash
git add design-assets/fallback-covers/source public/images/fallbacks
git commit -m "assets(content): add topic fallback cover set"
```

## Task 4: Fix False Matching and Cover Promotion

**Files:**

- Modify: `src/lib/content-automation/content-reader.ts`
- Test: `scripts/topic-fallback-cover-regression-test.ts`

- [ ] **Step 1: Remove the unsafe `lite` substring override**

Delete the broad `'lite'` entry from `HARDWARE_IMAGE_OVERRIDES`. Product matching must use normalized tokens or full product names; `haystack.includes('lite')` is forbidden because it matches words such as `listed`.

- [ ] **Step 2: Preserve explicit cover sources**

```ts
const hasExplicitCover = Boolean(parsed.media?.coverImage?.src || parsed.coverImage);
let finalCoverImage = coverImage;

if (!hasExplicitCover && firstMatchedSection?.imageMatch) {
  finalCoverImage = {
    src: firstMatchedSection.imageMatch.src,
    alt: firstMatchedSection.imageMatch.alt || parsed.title || parsed.slug,
    caption: firstMatchedSection.imageMatch.caption || parsed.excerpt || '',
    credit: firstMatchedSection.imageMatch.source || 'FPVLovers hardware catalog',
    sourceUrl: firstMatchedSection.imageMatch.sourceUrl || '',
  };
} else if (!hasExplicitCover && media.gallery?.length) {
  const firstGalleryImage = media.gallery[0];
  finalCoverImage = {
    src: firstGalleryImage.src,
    alt: firstGalleryImage.alt || parsed.title || parsed.slug,
    caption: firstGalleryImage.caption || parsed.excerpt || '',
    credit: firstGalleryImage.credit || 'FPVLovers gallery',
    sourceUrl: firstGalleryImage.sourceUrl || '',
  };
}
```

- [ ] **Step 3: Run the regression test**

Run: `pnpm content:topic-cover-test`

Expected: PASS, including `currently listed` not producing a BETAFPV receiver and explicit racing cover remaining unchanged.

- [ ] **Step 4: Commit the matching correction**

```bash
git add src/lib/content-automation/content-reader.ts scripts/topic-fallback-cover-regression-test.ts
git commit -m "fix(content): prevent unrelated cover promotion"
```

## Task 5: Wire the Three-State Fallback into Article and Homepage Cards

**Files:**

- Create: `src/features/content/components/ResilientCardCover.tsx`
- Modify: `src/features/content/components/ResilientArticleCover.tsx`
- Modify: `src/lib/homepage/homepage-content.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/article/[slug]/page.tsx`
- Modify: `scripts/article-cover-fallback-regression-test.mjs`

- [ ] **Step 1: Extend homepage card data**

Add `fallbackCoverImage: string` to `HomepageSectionCard` and set it with:

```ts
fallbackCoverImage: resolveFallbackCover({
  category: item.category,
  metadata: item.metadata,
}),
```

- [ ] **Step 2: Add a card cover with bounded error transitions**

```tsx
"use client";
// Remote cover failures require client state to switch to local topic assets.

import Image from 'next/image';
import { useState } from 'react';

type ResilientCardCoverProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
};

export function ResilientCardCover({ src, fallbackSrc, alt }: ResilientCardCoverProps) {
  const generic = '/images/fallbacks/fpv-generic.webp';
  const sources = Array.from(new Set([src, fallbackSrc, generic]));
  const [index, setIndex] = useState(0);
  const current = sources[index];
  if (!current) return null;

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes="(min-width: 768px) 33vw, 100vw"
      unoptimized
      className="h-full w-full object-cover opacity-[0.92] transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
      onError={() => setIndex((value) => Math.min(value + 1, sources.length))}
    />
  );
}
```

- [ ] **Step 3: Replace homepage card `Image` usage**

Use:

```tsx
<ResilientCardCover
  src={card.coverImage}
  fallbackSrc={card.fallbackCoverImage}
  alt={card.coverImageAlt || card.title}
/>
```

Keep layout, sizing, hover behavior, and routes unchanged.

- [ ] **Step 4: Extend article cover props**

Add `fallbackSource: string` and use the unique ordered source array `[asset.src, fallbackSource, '/images/fallbacks/fpv-generic.webp']`. Remove the API cover route from the runtime error path; attribution reads `FPVLovers topic fallback` after the original fails.

- [ ] **Step 5: Resolve the article fallback server-side**

```tsx
fallbackSource={resolveFallbackCover({
  category: a.category,
  metadata: a.metadata,
})}
```

- [ ] **Step 6: Strengthen the static regression test**

Require the test to assert:

- homepage imports and renders `ResilientCardCover`;
- both resilient components contain `fpv-generic.webp`;
- article page passes `fallbackSource`;
- homepage model calls `resolveFallbackCover`;
- both components have bounded `onError` transitions.

- [ ] **Step 7: Run targeted verification**

Run:

```bash
pnpm content:topic-cover-test
pnpm content:cover-test
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all PASS.

- [ ] **Step 8: Commit the integration**

```bash
git add src/features/content/components/ResilientCardCover.tsx src/features/content/components/ResilientArticleCover.tsx src/lib/homepage/homepage-content.ts src/app/page.tsx 'src/app/article/[slug]/page.tsx' scripts/article-cover-fallback-regression-test.mjs
git commit -m "fix(ui): add topic-aware cover fallbacks"
```

## Task 6: Browser and Production Verification

**Files:**

- Modify only if evidence exposes a defect in Tasks 1–5.

- [ ] **Step 1: Run the full relevant local gate**

Run:

```bash
pnpm content:topic-cover-test
pnpm content:cover-test
pnpm media:audit
pnpm content:audit
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all PASS and production build completes.

- [ ] **Step 2: Verify locally in a real browser**

Inspect:

- homepage Recent Posts;
- the Street League Racing article;
- one review, one buyer guide, one tuning article, and one working original cover;
- mobile and desktop card crops;
- browser console errors.

Expected: Street League uses Racing fallback after its remote image fails; no receiver image appears; valid originals remain unchanged.

- [ ] **Step 3: Commit any evidence-driven correction separately**

Use a scoped conventional commit containing only the files required by the observed defect.

- [ ] **Step 4: Update project handoff after verification**

Record commits, local verification, deployment state, and the exact next production step in `PROJECT_MEMORY.md` and `NEXT_ACTIONS.md` without claiming deployment before it occurs.

- [ ] **Step 5: Deploy through the existing Coolify workflow**

Deploy only after credential-rotation requirements and remote Git synchronization are satisfied.

- [ ] **Step 6: Live-verify production**

Confirm the six previously blank Recent Posts images render topic-correct local fallbacks, the Street League article uses Racing, and at least one valid original product cover remains original.

## Self-Review

- Spec coverage: all twelve topic families, generic fallback, explicit-cover preservation, bounded error handling, asset QA, homepage/article reuse, and production verification are covered.
- Scope: no new public route, runtime generator, proxy service, redesign, or persisted render-time mutation.
- Type consistency: `FallbackCoverFamily`, `FALLBACK_COVER_PATHS`, and `resolveFallbackCover()` are used consistently.
- Known production bug: the broad `lite` substring and unconditional first-section cover promotion are both tested and removed.

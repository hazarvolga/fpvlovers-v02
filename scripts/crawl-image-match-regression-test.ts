import assert from 'node:assert/strict';
import type { LicensedImage } from '@/lib/content-automation/crawl-image-license';
import { harvestImagesFromMarkdown } from '@/lib/content-automation/crawl-image-harvest';
import {
  MEDIA_MATCHER_VERSION,
  pickBestRelevantImageMatch,
  type SectionInput,
} from '@/lib/content-automation/crawl-image-match';
import {
  buildSourceSearchUrl,
  buildSourceSearchUrls,
  extractRelevantSourcePages,
} from '@/lib/content-automation/source-page-discovery';
import {
  parseVisionDecision,
  rankVisionCandidates,
  VISION_RERANKER_VERSION,
} from '@/lib/content-automation/vision-image-reranker';

const sections: SectionInput[] = [
  {
    id: 'vtx-power',
    title: 'VTX Power Levels for FPV Range and Heat',
    content: 'Compare 25 mW, 200 mW and higher video transmitter output levels.',
  },
];

function image(input: Partial<LicensedImage> & Pick<LicensedImage, 'id' | 'src'>): LicensedImage {
  return {
    alt: '',
    sourceUrl: 'https://example.com/source-article',
    hostname: 'example.com',
    context: '',
    license: 'attribution-only',
    canSelfHost: false,
    licenseReason: 'Regression fixture',
    ...input,
  };
}

assert.equal(MEDIA_MATCHER_VERSION, 'media-v3');

assert.equal(
  pickBestRelevantImageMatch([
    image({
      id: 'generic-kit',
      src: 'https://www.fpvknowitall.com/images/qav-s-2-analog-kit.webp',
      alt: 'QAV-S 2 analog kit',
      context: 'VTX power levels affect FPV range, heat and local rules.',
    }),
  ], sections),
  undefined,
  'Context-only overlap must not promote an unrelated product kit as the cover',
);

assert.deepEqual(
  buildSourceSearchUrls(
    'https://oscarliang.com/',
    'Acro Stick Control Drills for FPV Beginners',
  ),
  [
    'https://oscarliang.com/?s=acro+stick+control+drills+beginners',
    'https://oscarliang.com/?s=acro+stick+control+drills',
  ],
  'Discovery should retain a focused fallback query for long article titles',
);

assert.equal(
  pickBestRelevantImageMatch([
    image({
      id: 'race-svg',
      src: 'https://www.expresslrs.org/assets/images/drone_race.svg',
      alt: 'Drone race',
      context: 'Acro stick control drills for FPV beginners improve flight control.',
    }),
  ], [{
    id: 'acro-drills',
    title: 'Acro Stick Control Drills for FPV Beginners',
    content: 'Practice coordinated throttle, yaw, pitch and roll movements.',
  }]),
  undefined,
  'SVG illustrations must not be promoted as editorial covers',
);

const validMatch = pickBestRelevantImageMatch([
  image({
    id: 'vtx-chart',
    src: 'https://example.com/media/vtx-power-levels-output.webp',
    alt: 'VTX power levels output chart',
    context: 'Video transmitter output levels from 25 mW to 800 mW.',
  }),
], sections);

assert.ok(validMatch, 'A strongly identified VTX image should remain eligible');
assert.equal(validMatch.image.id, 'vtx-chart');
assert.match(validMatch.reason, /media-v3 strong-cover/);

assert.equal(
  buildSourceSearchUrl(
    'https://oscarliang.com/',
    'VTX Power Levels Explained for FPV Range and Heat',
  ),
  'https://oscarliang.com/?s=vtx+power+levels+range+heat',
);

assert.deepEqual(
  extractRelevantSourcePages({
    sourceUrl: 'https://oscarliang.com/?s=vtx+power+levels',
    query: 'VTX Power Levels for FPV Range and Heat',
    markdown: [
      '[Understanding VTX Power Levels](https://oscarliang.com/vtx-power-levels-range/)',
      '[Blackbox PID Tuning](https://oscarliang.com/blackbox-pid-tuning/)',
      '[VTX logo](https://oscarliang.com/wp-content/uploads/vtx-logo.svg)',
      '[External VTX article](https://example.com/vtx-power-levels/)',
      '[Category](https://oscarliang.com/category/fpv/)',
    ].join('\n'),
  }),
  ['https://oscarliang.com/vtx-power-levels-range/'],
  'Discovery must keep only relevant same-host article pages',
);

const richHarvest = harvestImagesFromMarkdown({
  url: 'https://example.com/vtx-power-guide/',
  markdown: [
    '<meta property="og:image" content="/media/vtx-cover.jpg">',
    '<picture><source srcset="/media/vtx-small.jpg 320w, /media/vtx-large.webp 1600w"></picture>',
    '<script type="application/ld+json">{"image":{"url":"https:\\/\\/example.com\\/media\\/vtx-diagram.webp"}}</script>',
  ].join('\n'),
});
assert.deepEqual(
  richHarvest.map((candidate) => candidate.src),
  [
    'https://example.com/media/vtx-large.webp',
    'https://example.com/media/vtx-cover.jpg',
    'https://example.com/media/vtx-diagram.webp',
  ],
  'Harvest should prefer the largest srcset asset and retain social/JSON-LD covers',
);

assert.deepEqual(
  extractRelevantSourcePages({
    sourceUrl: 'https://www.fpvknowitall.com/?s=blackbox',
    query: 'Blackbox Analysis Masterclass',
    markdown: '[How to Read Blackbox Logs](/blackbox-log-analysis/)',
  }),
  ['https://www.fpvknowitall.com/blackbox-log-analysis/'],
  'A single strong technical term should be enough to discover a focused article',
);

assert.equal(VISION_RERANKER_VERSION, 'vision-v1');
assert.deepEqual(
  rankVisionCandidates([
    image({
      id: 'generic-file-relevant-context',
      src: 'https://example.com/media/IMG_4821.webp',
      context: 'A chart comparing VTX output at 25 mW, 200 mW and 800 mW.',
    }),
    image({
      id: 'irrelevant',
      src: 'https://example.com/media/motor.jpg',
      context: 'A motor bell and propeller.',
    }),
    image({
      id: 'svg',
      src: 'https://example.com/media/vtx-power.svg',
      context: 'VTX power chart.',
    }),
  ], 'VTX Power Levels for Range and Heat').map((candidate) => candidate.image.id),
  ['generic-file-relevant-context', 'irrelevant'],
  'Vision prefilter should rank metadata matches first, retain raster fallbacks and reject SVG media',
);

assert.deepEqual(
  parseVisionDecision({
    score: 1.4,
    directlyRelevant: true,
    visibleSubject: 'VTX output power chart',
    reason: 'The chart directly compares transmitter power levels.',
  }),
  {
    score: 1,
    directlyRelevant: true,
    visibleSubject: 'VTX output power chart',
    reason: 'The chart directly compares transmitter power levels.',
  },
);
assert.equal(parseVisionDecision('not-json'), undefined);

console.log('crawl image matcher regression checks passed');

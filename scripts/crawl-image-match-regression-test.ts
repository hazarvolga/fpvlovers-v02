import assert from 'node:assert/strict';
import type { LicensedImage } from '@/lib/content-automation/crawl-image-license';
import {
  MEDIA_MATCHER_VERSION,
  pickBestRelevantImageMatch,
  type SectionInput,
} from '@/lib/content-automation/crawl-image-match';

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

console.log('crawl image matcher regression checks passed');

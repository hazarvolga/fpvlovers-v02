import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensureMediaArtifact } from '@/lib/content-automation/content-reader';
import {
  FALLBACK_COVER_PATHS,
  resolveFallbackCover,
} from '@/lib/content-automation/fallback-cover';

assert.equal(
  resolveFallbackCover({ contentType: 'news', discipline: ['racing'] }),
  FALLBACK_COVER_PATHS.racing,
);
assert.equal(
  resolveFallbackCover({ contentType: 'review', components: ['radio'] }),
  FALLBACK_COVER_PATHS.commercial,
);
assert.equal(
  resolveFallbackCover({ metadata: { discipline: ['freestyle'] } }),
  FALLBACK_COVER_PATHS.freestyle,
);
assert.equal(
  resolveFallbackCover({ metadata: { discipline: ['long-range'] } }),
  FALLBACK_COVER_PATHS['cinematic-long-range'],
);
assert.equal(
  resolveFallbackCover({ category: 'beginner' }),
  FALLBACK_COVER_PATHS['academy-beginner'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['soldering'] } }),
  FALLBACK_COVER_PATHS['build-workshop'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['blackbox'] } }),
  FALLBACK_COVER_PATHS['tuning-betaflight'],
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['propeller'] } }),
  FALLBACK_COVER_PATHS['motors-propulsion'],
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['battery'] } }),
  FALLBACK_COVER_PATHS['power-battery-esc'],
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['digital-video'] } }),
  FALLBACK_COVER_PATHS['video-goggles-vtx'],
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['elrs'] } }),
  FALLBACK_COVER_PATHS['radio-elrs-gps'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['safety'] } }),
  FALLBACK_COVER_PATHS['safety-regulations'],
);
assert.equal(
  resolveFallbackCover({
    category: 'Racing',
    metadata: { components: ['battery'] },
  }),
  FALLBACK_COVER_PATHS['power-battery-esc'],
);
assert.equal(
  resolveFallbackCover({
    category: 'Racing',
    metadata: { topics: ['betaflight'] },
  }),
  FALLBACK_COVER_PATHS['tuning-betaflight'],
);
assert.equal(
  resolveFallbackCover({
    category: 'Build Guides',
    metadata: { discipline: ['long-range'] },
  }),
  FALLBACK_COVER_PATHS['cinematic-long-range'],
);
assert.equal(
  resolveFallbackCover({
    category: 'Racing',
    metadata: { contentType: 'review', components: ['battery'] },
  }),
  FALLBACK_COVER_PATHS.commercial,
);
assert.equal(
  resolveFallbackCover({ metadata: { difficulty: 'beginner' } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ metadata: { audience: ['new-pilot'] } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['racing'] } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ metadata: { discipline: ['battery' as never] } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ category: 'elrs' }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['cinematic'] } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(
  resolveFallbackCover({ metadata: { components: ['beginner'] } }),
  FALLBACK_COVER_PATHS.generic,
);
assert.equal(resolveFallbackCover(undefined), FALLBACK_COVER_PATHS.generic);
assert.equal(resolveFallbackCover({}), FALLBACK_COVER_PATHS.generic);

const explicitCover = 'https://example.com/racing-cover.jpg';
const artifact = ensureMediaArtifact({
  slug: 'street-league-spec-upcoming-races-section-currently-empty',
  title: 'Street League Spec: Upcoming Races Section Currently Empty',
  category: 'Racing',
  coverImage: explicitCover,
  bodySections: [
    {
      id: 'upcoming-races',
      title: 'Upcoming Races',
      content: 'No races are currently listed.',
    },
  ],
});

assert.ok(artifact);
assert.equal(artifact.media?.coverImage.src, explicitCover);
assert.notEqual(artifact.media?.coverImage.alt, 'BETAFPV ELRS Lite 2.4GHz Receiver');

for (const coverPath of Object.values(FALLBACK_COVER_PATHS)) {
  assert.ok(fs.existsSync(`public${coverPath}`), `Missing fallback cover asset: ${coverPath}`);
}

console.log('topic fallback cover regression checks passed');

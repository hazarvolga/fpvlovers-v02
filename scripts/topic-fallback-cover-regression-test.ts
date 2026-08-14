import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensureMediaArtifact } from '@/lib/content-automation/content-reader';
import {
  FALLBACK_COVER_PATHS,
  resolveDisplayCover,
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
  resolveFallbackCover({
    title: 'Blackbox Analysis Masterclass',
    metadata: { topics: ['tuning'], discipline: ['racing'] },
  }),
  FALLBACK_COVER_PATHS['tuning-betaflight'],
  'A specific tuning topic must outrank a broad racing discipline',
);
assert.equal(
  resolveFallbackCover({
    title: 'Acro Stick Control Drills for FPV Beginners',
    slug: 'acro-stick-control-drills-for-fpv-beginners',
    category: 'Flight Guides',
  }),
  FALLBACK_COVER_PATHS['academy-beginner'],
  'Title signals should classify legacy articles with missing metadata',
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
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['Build Guides'] } }),
  FALLBACK_COVER_PATHS['build-workshop'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['build-guides'] } }),
  FALLBACK_COVER_PATHS['build-workshop'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['Flight Control'] } }),
  FALLBACK_COVER_PATHS['tuning-betaflight'],
);
assert.equal(
  resolveFallbackCover({ metadata: { topics: ['flight-control'] } }),
  FALLBACK_COVER_PATHS['tuning-betaflight'],
);
assert.equal(resolveFallbackCover(undefined), FALLBACK_COVER_PATHS.generic);
assert.equal(resolveFallbackCover({}), FALLBACK_COVER_PATHS.generic);

assert.equal(
  resolveDisplayCover(
    '/api/content/media/cover/street-league-spec-upcoming-races-section-currently-empty',
    FALLBACK_COVER_PATHS.racing,
    'street-league-spec-upcoming-races-section-currently-empty',
  ),
  '/api/content/media/cover/street-league-spec-upcoming-races-section-currently-empty',
);
assert.equal(
  resolveDisplayCover('https://example.com/real-race-cover.jpg', FALLBACK_COVER_PATHS.racing),
  'https://example.com/real-race-cover.jpg',
);

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

const placeholderArtifact = ensureMediaArtifact({
  slug: 'street-league-placeholder-cover',
  title: 'Street League Placeholder Cover',
  category: 'Racing',
  coverImage: '/api/content/media/cover/street-league-placeholder-cover',
  bodySections: [],
});
assert.ok(placeholderArtifact);
assert.equal(
  placeholderArtifact.media?.coverImage.src,
  '/api/content/media/cover/street-league-placeholder-cover',
);

const legacyArtifact = ensureMediaArtifact({
  slug: 'legacy-commercial-cover',
  title: 'Legacy Commercial Cover',
  category: 'Components',
  coverImage: FALLBACK_COVER_PATHS.commercial,
  bodySections: [],
});
assert.equal(
  legacyArtifact?.media?.coverImage.src,
  '/api/content/media/cover/legacy-commercial-cover',
);

for (const coverPath of Object.values(FALLBACK_COVER_PATHS)) {
  assert.ok(fs.existsSync(`public${coverPath}`), `Missing fallback cover asset: ${coverPath}`);
}

console.log('topic fallback cover regression checks passed');

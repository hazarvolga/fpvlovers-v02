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

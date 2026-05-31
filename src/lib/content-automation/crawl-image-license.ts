import type { HarvestedImage } from './crawl-image-harvest';

/**
 * License classification for harvested crawl images.
 *
 * Copyright stance (approved hybrid model):
 *  - `open`            → genuinely open-licensed or explicitly press/media-kit
 *                        imagery. Safe to self-host and re-serve.
 *  - `attribution-only`→ everything else. We may surface it via hotlink with a
 *                        clickable attribution back to the source, never by
 *                        copying the asset onto our own origin.
 *
 * The classifier is deliberately conservative: an image is only promoted to
 * `open` with positive evidence (known open host or an explicit press path).
 * Absent that, it defaults to `attribution-only` so we never over-claim a
 * usage right we cannot prove.
 */

export type ImageLicense = 'open' | 'attribution-only';

export type LicensedImage = HarvestedImage & {
  license: ImageLicense;
  /** Self-hostable only when the license is `open`. */
  canSelfHost: boolean;
  /** Short, human-readable justification for the classification. */
  licenseReason: string;
};

/** Hosts whose imagery is reliably open-licensed (CC / public domain). */
const OPEN_HOSTS = [
  'wikimedia.org',
  'commons.wikimedia.org',
  'wikipedia.org',
  'upload.wikimedia.org',
  'creativecommons.org',
  'openverse.org',
  'images.pexels.com',
  'pexels.com',
  'unsplash.com',
  'images.unsplash.com',
];

/**
 * Path fragments that signal an image lives in an official press / media kit,
 * which manufacturers publish specifically for editorial reuse with credit.
 */
const PRESS_PATH_HINTS = ['/press', '/media-kit', '/mediakit', '/newsroom', '/media/press', '/brand-assets'];

/** Explicit Creative-Commons markers occasionally encoded in the URL. */
const CC_URL_HINTS = ['cc-by', 'cc0', 'creativecommons', 'public-domain', 'publicdomain'];

function hostMatches(hostname: string, candidates: string[]): boolean {
  const host = hostname.toLowerCase();
  return candidates.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

/**
 * Classify a single harvested image. Pure function over the image's own
 * metadata — no network calls, so it is safe to run server-side in bulk.
 */
export function classifyImageLicense(image: HarvestedImage): LicensedImage {
  const src = image.src.toLowerCase();
  const sourceUrl = image.sourceUrl.toLowerCase();

  if (hostMatches(image.hostname, OPEN_HOSTS)) {
    return decorate(image, 'open', `Open-licensed host (${image.hostname})`);
  }

  if (CC_URL_HINTS.some((hint) => src.includes(hint))) {
    return decorate(image, 'open', 'Creative Commons marker in image URL');
  }

  if (PRESS_PATH_HINTS.some((hint) => src.includes(hint) || sourceUrl.includes(hint))) {
    return decorate(image, 'open', 'Published in an official press / media kit');
  }

  return decorate(
    image,
    'attribution-only',
    `Unverified license on ${image.hostname}; hotlink with attribution only`,
  );
}

export function classifyImageLicenses(images: ReadonlyArray<HarvestedImage>): LicensedImage[] {
  return images.map(classifyImageLicense);
}

function decorate(image: HarvestedImage, license: ImageLicense, licenseReason: string): LicensedImage {
  return {
    ...image,
    license,
    canSelfHost: license === 'open',
    licenseReason,
  };
}

import type { LicensedImage } from './crawl-image-license';

/**
 * Semantic image ↔ content matching.
 *
 * Given a pool of licensed, harvested images and the body sections of a
 * generated article, decide which image (if any) belongs to each section.
 *
 * Hard rule (copyright + relevance): an image is attached to a section ONLY
 * when the overlap score clears a confidence threshold. Below threshold the
 * section gets NO image — we never inject an unrelated picture, and we never
 * fall back to stock here. That decision lives downstream in buildContentMedia.
 *
 * The scorer is a pure function over text tokens (alt + surrounding context vs.
 * the section's title + body), so it is deterministic and safe to run in bulk
 * server-side with no network calls.
 */

export type SectionInput = {
  /** Stable section id from the parsed article. */
  id: string;
  /** Section heading. */
  title: string;
  /** Section body text. */
  content: string;
};

export type SectionImageMatch = {
  sectionId: string;
  image: LicensedImage;
  /** Normalized 0–1 confidence the image belongs to this section. */
  score: number;
  /** Human-readable reason persisted for media selection audits. */
  reason: string;
};

export type MatchResult = {
  /** One entry per section that cleared the threshold, best image first. */
  matches: SectionImageMatch[];
  /** Images that cleared no section — kept for optional cover/gallery use. */
  unmatched: LicensedImage[];
};

/**
 * Minimum overlap score for an image to be attached to a section.
 * Set conservatively but not so high that blank alt-text images are always
 * excluded. Alt text is frequently missing on FPV editorial sites; when it is,
 * context carries the full signal weight. 0.08 requires at least a handful of
 * shared distinctive tokens — better than 0.18 which excluded everything when
 * alt was empty (common on oscarliang.com, rotorriot.com, multigp.com).
 */
export const MEDIA_MATCHER_VERSION = 'media-v2';
const MATCH_THRESHOLD = 0.12;

const RACING_HOSTS = new Set([
  'dronechampionsleague.com',
  'droneracing.fai.org',
  'multigp.com',
]);

const TECHNICAL_TERMS = new Set([
  'blackbox', 'betaflight', 'pid', 'gyro', 'filter', 'filters', 'tuning',
  'firmware', 'telemetry', 'vtx', 'esc', 'motor', 'battery', 'elrs',
]);

/** Generic FPV/web words that carry little discriminative signal. */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'this', 'that', 'are', 'from',
  'have', 'has', 'will', 'can', 'how', 'what', 'when', 'why', 'which', 'into',
  'out', 'use', 'using', 'used', 'get', 'set', 'all', 'any', 'one', 'two',
  'fpv', 'drone', 'drones', 'image', 'photo', 'photos', 'picture', 'view',
  'best', 'guide', 'guides', 'tips', 'here', 'more', 'about', 'over', 'than',
  'a', 'an', 'in', 'on', 'of', 'to', 'is', 'it', 'as', 'at', 'by', 'or', 'be',
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function tokenSet(value: string): Set<string> {
  return new Set(tokenize(value));
}

/**
 * Weighted Jaccard-style overlap.
 * When alt text is present it is the dominant signal (0.7 weight) because it
 * is the author's own description. When alt is empty or tiny (common on FPV
 * sites like oscarliang.com), context carries full weight (1.0) so those
 * images are not systematically excluded.
 */
function hasAny(tokens: Set<string>, candidates: Set<string>): boolean {
  for (const token of candidates) {
    if (tokens.has(token)) return true;
  }
  return false;
}

function scoreImageAgainstSection(
  image: LicensedImage,
  titleTokens: Set<string>,
  sectionTokens: Set<string>,
): number {
  if (sectionTokens.size === 0) return 0;

  const altTokens = tokenSet(image.alt);
  const contextTokens = tokenSet(image.context);
  const imageTokens = new Set([...altTokens, ...contextTokens]);
  if (imageTokens.size === 0) return 0;

  const normalizedHost = image.hostname.toLowerCase().replace(/^www\./, '');
  const racingHost = [...RACING_HOSTS].some(
    (host) => normalizedHost === host || normalizedHost.endsWith(`.${host}`),
  );
  if (racingHost && hasAny(sectionTokens, TECHNICAL_TERMS)) return 0;

  const shared = [...imageTokens].filter((token) => sectionTokens.has(token));
  const titleHits = shared.filter((token) => titleTokens.has(token)).length;
  const technicalHits = shared.filter((token) => TECHNICAL_TERMS.has(token)).length;
  if (shared.length < 2 && titleHits === 0 && technicalHits === 0) return 0;

  const precision = shared.length / Math.min(imageTokens.size, 24);
  const coverage = shared.length / Math.min(sectionTokens.size, 24);
  const titleSignal = titleTokens.size > 0 ? titleHits / Math.min(titleTokens.size, 8) : 0;
  const technicalSignal = technicalHits > 0 ? 0.18 : 0;
  return Math.min(1, precision * 0.45 + coverage * 0.2 + titleSignal * 0.35 + technicalSignal);
}

/**
 * Match a pool of images to article sections. Each image is assigned to at most
 * one section (its best fit), and each section keeps at most one image (its best
 * candidate). Greedy by descending score, which is stable and good enough for an
 * editorial layout where we only need one figure per section.
 */
export function matchImagesToSections(
  images: ReadonlyArray<LicensedImage>,
  sections: ReadonlyArray<SectionInput>,
): MatchResult {
  const sectionTokens = new Map<string, Set<string>>();
  const sectionTitleTokens = new Map<string, Set<string>>();
  for (const section of sections) {
    sectionTitleTokens.set(section.id, tokenSet(section.title));
    sectionTokens.set(section.id, tokenSet(`${section.title} ${section.content}`));
  }

  type Candidate = { sectionId: string; image: LicensedImage; score: number };
  const candidates: Candidate[] = [];

  for (const image of images) {
    for (const section of sections) {
      const score = scoreImageAgainstSection(
        image,
        sectionTitleTokens.get(section.id)!,
        sectionTokens.get(section.id)!,
      );
      if (score >= MATCH_THRESHOLD) {
        candidates.push({ sectionId: section.id, image, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const usedImages = new Set<string>();
  const filledSections = new Set<string>();
  const matches: SectionImageMatch[] = [];

  for (const candidate of candidates) {
    if (usedImages.has(candidate.image.id)) continue;
    if (filledSections.has(candidate.sectionId)) continue;
    usedImages.add(candidate.image.id);
    filledSections.add(candidate.sectionId);
    matches.push({
      sectionId: candidate.sectionId,
      image: candidate.image,
      score: candidate.score,
      reason: `media-v2 lexical-topic score ${candidate.score.toFixed(3)}`,
    });
  }

  // Preserve original section order in the output for predictable layout.
  const order = new Map(sections.map((section, index) => [section.id, index]));
  matches.sort((a, b) => (order.get(a.sectionId) ?? 0) - (order.get(b.sectionId) ?? 0));

  const unmatched = images.filter((image) => !usedImages.has(image.id));

  return { matches, unmatched };
}

/**
 * Pick the single best image across all sections — used as a relevant cover
 * candidate when one exists. Returns undefined when nothing clears the
 * threshold, so the caller can fall back to local SVG art instead of stock.
 */
export function pickBestRelevantImage(
  images: ReadonlyArray<LicensedImage>,
  sections: ReadonlyArray<SectionInput>,
): LicensedImage | undefined {
  const { matches } = matchImagesToSections(images, sections);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, current) => (current.score > best.score ? current : best)).image;
}

export function pickBestRelevantImageMatch(
  images: ReadonlyArray<LicensedImage>,
  sections: ReadonlyArray<SectionInput>,
): SectionImageMatch | undefined {
  const { matches } = matchImagesToSections(images, sections);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, current) => (current.score > best.score ? current : best));
}

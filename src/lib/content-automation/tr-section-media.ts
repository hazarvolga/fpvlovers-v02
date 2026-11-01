import type { ContentMediaAsset } from './content-media';
import { normalizeSearchText } from '@/lib/i18n/search-text';

export type TurkishSectionImageFamily =
  | 'academy'
  | 'power'
  | 'radio'
  | 'regulation'
  | 'starter'
  | 'build'
  | 'video'
  | 'generic';

export type TurkishSectionImageAsset = ContentMediaAsset & {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  kind: 'generated-artwork';
  source: string;
  topics: readonly string[];
  family: TurkishSectionImageFamily;
};

export type TurkishSectionInput = {
  id: string;
  title: string;
  content: string;
  imageMatch?: ContentMediaAsset;
};

export type TurkishSectionImagePick = {
  sectionId: string;
  asset: TurkishSectionImageAsset;
  score: number;
};

const fallbackSrc = (name: string) => `/images/fallbacks/fpv-${name}.webp`;

function editorialAsset(
  name: string,
  alt: string,
  family: TurkishSectionImageFamily,
  topics: readonly string[],
): TurkishSectionImageAsset {
  return {
    src: fallbackSrc(name),
    alt,
    caption: alt,
    credit: 'FPVLovers editoryal görseli',
    license: 'FPVLovers generated artwork',
    kind: 'generated-artwork',
    source: 'FPVLovers editorial media library',
    topics,
    family,
  };
}

/**
 * Alt text is written against the actual artwork in public/images/fallbacks/
 * (labelled contact sheet reviewed 2026-11-01), not against the filename.
 * Topics are already folded to ASCII: tokenization runs normalizeSearchText.
 */
export const TR_SECTION_IMAGE_LIBRARY: readonly TurkishSectionImageAsset[] = [
  editorialAsset('academy-beginner', 'Masa üzerinde FPV kumanda, drone, gözlük ve batarya', 'academy', [
    'kumanda', 'gozluk', 'batarya', 'ekipman', 'masa',
  ]),
  editorialAsset('academy-simulator', 'FPV kumandası ve simülatör çalıştıran dizüstü bilgisayar', 'academy', [
    'simulator', 'simulatoru', 'simulatorde', 'simulasyon', 'simulasyonda',
    'bilgisayar', 'sanal', 'pratik', 'oturum', 'gaz', 'stick',
  ]),
  editorialAsset('academy-stick-control', 'FPV kumandasının stickleri ve arka planda tiny whoop', 'academy', [
    'stick', 'gaz', 'yaw', 'pitch', 'roll', 'kontrol', 'acro', 'whoop',
    'tinywhoop', 'kumanda', 'hover',
  ]),
  editorialAsset('build-soldering', 'Lehim istasyonu, FPV drone gövdesi ve el aletleri', 'build', [
    'lehim', 'havya', 'lehimleme', 'govde', 'alet', 'atolye', 'montaj',
  ]),
  editorialAsset('build-workshop', 'FPV drone parçaları, tornavida ve lehim ekipmanı', 'build', [
    'parca', 'parcalar', 'parcalari', 'tamir', 'bakim', 'atolye', 'montaj', 'vida', 'alet',
  ]),
  editorialAsset('commercial-starter-kit', 'Koruyucu çanta içinde drone, batarya ve kumanda seti', 'starter', [
    'set', 'seti', 'setler', 'setleri', 'rtf', 'bnf', 'paket', 'cantasi', 'hazir', 'kit', 'kiti',
  ]),
  editorialAsset('generic', 'Tezgâh üzerinde FPV drone ve uçuş ekipmanı', 'generic', [
    'genel', 'tezgah', 'ekipman',
  ]),
  editorialAsset('motors-prop-selection', 'FPV motorları ve pervane setleri düzenli biçimde sergileniyor', 'build', [
    'motor', 'motorlar', 'pervane', 'pervaneler', 'kv', 'stator',
  ]),
  editorialAsset('motors-propulsion', 'Motor üzerine monte edilmiş FPV pervanesi', 'build', [
    'itki', 'pervane', 'motor', 'guc',
  ]),
  editorialAsset('power-battery-esc', 'LiPo batarya, ESC kartı ve XT60 konnektör', 'power', [
    'batarya', 'bataryalar', 'bataryasi', 'lipo', 'esc', 'konnektor', 'xt60', 'guc', 'voltaj',
  ]),
  editorialAsset('power-charging', 'LiPo şarj cihazı ve şarj edilen bataryalar', 'power', [
    'sarj', 'sarjda', 'sarjli', 'sarjdan', 'charger', 'yangin',
  ]),
  editorialAsset('power-lipo-selection', 'Farklı kapasitelerde LiPo batarya paketleri', 'power', [
    'lipo', 'batarya', 'bataryalar', 'hucre', 'mah', 'voltaj', 'kapasite',
  ]),
  editorialAsset('radio-elrs-gps', 'FPV kumandası yakın çekim', 'radio', [
    'kumanda', 'kumandaniz', 'kumandanin', 'radyo', 'elrs', 'verici',
    'vericiler', 'stick', 'mod', 'baglanti',
  ]),
  editorialAsset('radio-elrs-gps-alt', 'FPV kumandası, drone ve ELRS alıcısı', 'radio', [
    'kumanda', 'elrs', 'alici', 'alicii', 'radyo', 'baglanti', 'menzil',
  ]),
  editorialAsset('safety-regulations', 'Tezgâhta FPV drone ve ekipman çantası', 'regulation', [
    'guvenlik', 'kural', 'kurallari', 'mevzuat', 'izin', 'kayit',
    'sinir', 'shgm', 'iha', 'sorumluluk',
  ]),
  editorialAsset('video-goggles-camera', 'FPV gözlüğü ve kamera modülü', 'video', [
    'gozluk', 'gozlugu', 'kamera', 'goruntu', 'video',
  ]),
  editorialAsset('video-goggles-vtx', 'FPV gözlüğü, antenler ve kumanda', 'video', [
    'gozluk', 'vtx', 'anten', 'verici', 'goruntu', 'kanal',
  ]),
];

const LIBRARY_BY_SRC = new Map(TR_SECTION_IMAGE_LIBRARY.map((asset) => [asset.src, asset]));

const FAMILY_DEFAULTS: Record<TurkishSectionImageFamily, readonly string[]> = {
  academy: [fallbackSrc('academy-stick-control'), fallbackSrc('academy-simulator'), fallbackSrc('academy-beginner')],
  power: [fallbackSrc('power-charging'), fallbackSrc('power-lipo-selection'), fallbackSrc('power-battery-esc')],
  radio: [fallbackSrc('radio-elrs-gps'), fallbackSrc('radio-elrs-gps-alt'), fallbackSrc('academy-stick-control')],
  regulation: [fallbackSrc('safety-regulations'), fallbackSrc('generic')],
  starter: [fallbackSrc('commercial-starter-kit'), fallbackSrc('academy-beginner'), fallbackSrc('radio-elrs-gps')],
  build: [fallbackSrc('build-workshop'), fallbackSrc('build-soldering')],
  video: [fallbackSrc('video-goggles-camera'), fallbackSrc('video-goggles-vtx')],
  generic: [fallbackSrc('generic'), fallbackSrc('academy-beginner')],
};

const FAMILY_RULES: ReadonlyArray<readonly [TurkishSectionImageFamily, RegExp]> = [
  ['regulation', /kural|mevzuat|shgm|\biha\b|izin|kayit/],
  ['radio', /kumanda|radyo|elrs|verici|transmitter/],
  ['power', /lipo|batarya|sarj|yangin/],
  ['starter', /starter|rtf|bnf|set(ler|i|leri)?\b/],
  ['video', /gozluk|vtx|kamera/],
  ['build', /tamir|lehim|atolye|montaj/],
  ['academy', /hover|stick|kontrol|simulat|baslangic|baslayan|kurulum/],
];

const REFERENCE_SECTION = /(sık sorulan|sik sorulan|sıkça sorulan|sikca sorulan|kaynakça|kaynakca|resmî kaynaklar|resmi kaynaklar|\bsss\b|\bfaq\b)/i;

const STOPWORDS = new Set([
  'bir', 'ile', 'icin', 'daha', 'veya', 'ama', 'gibi', 'olan', 'olarak', 'bu',
  'da', 'de', 'en', 'her', 'cok', 'sonra', 'once', 'kadar', 'uzerinde', 'uzerine',
  'sekilde', 'buyuk', 'kucuk',
]);

const TITLE_WEIGHT = 4;
const BODY_CAP = 8;
const FAMILY_BONUS = 3;
const MATCH_THRESHOLD = 4;
const MAX_IMAGES = 3;
const MIN_IMAGES = 2;

const EDITORIAL_SOURCE_NOTE = 'Local editorial WebP assets from public/images/fallbacks';
const EDITORIAL_ATTRIBUTION_NOTE = 'Body illustrations by FPVLovers';

function tokenize(value: string): string[] {
  return normalizeSearchText(value, 'tr')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

/**
 * The family decides two things: a tie-breaking bonus for images that match the
 * article's own subject, and the ordered pool used to reach the two-figure
 * floor when keyword matching alone is too sparse (regulation articles).
 */
export function resolveTurkishSectionFamily(
  slug: string,
  title: string,
): TurkishSectionImageFamily {
  const signal = normalizeSearchText(`${slug} ${title}`, 'tr');
  for (const [family, rule] of FAMILY_RULES) {
    if (rule.test(signal)) return family;
  }
  return 'generic';
}

/**
 * Deterministic section→image assignment. FAQ/appendix sections never receive
 * a figure and an image is used at most once per article. Sections backed by
 * crawled source photos keep their image and consume the figure budget;
 * sections this library already illustrated stay eligible so a repeat pass
 * selects the same assets and changes nothing.
 */
export function selectTurkishSectionImages(input: {
  slug: string;
  title: string;
  bodySections: ReadonlyArray<TurkishSectionInput>;
  maxImages?: number;
  minImages?: number;
}): TurkishSectionImagePick[] {
  const maxImages = input.maxImages ?? MAX_IMAGES;
  const minImages = Math.min(input.minImages ?? MIN_IMAGES, maxImages);
  const family = resolveTurkishSectionFamily(input.slug, input.title);

  const sourceFigures = input.bodySections.filter(
    (section) => Boolean(section.imageMatch?.src) && !LIBRARY_BY_SRC.has(section.imageMatch!.src),
  ).length;
  const budget = Math.max(0, maxImages - sourceFigures);
  if (budget === 0) return [];

  const sectionIndex = new Map(input.bodySections.map((section, index) => [section.id, index]));
  const eligible = input.bodySections.filter((section) => {
    if (REFERENCE_SECTION.test(section.title)) return false;
    const src = section.imageMatch?.src;
    return !src || LIBRARY_BY_SRC.has(src);
  });

  const titleTokens = new Map<string, Set<string>>();
  const bodyTokens = new Map<string, Set<string>>();
  for (const section of eligible) {
    titleTokens.set(section.id, new Set(tokenize(section.title)));
    // The first 1200 characters carry the section's topic; the rest is detail
    // that would drown the signal in repeated vocabulary.
    bodyTokens.set(section.id, new Set(tokenize(section.content.slice(0, 1200))));
  }

  const candidates: Array<{
    sectionId: string;
    asset: TurkishSectionImageAsset;
    score: number;
    assetIndex: number;
  }> = [];

  TR_SECTION_IMAGE_LIBRARY.forEach((asset, assetIndex) => {
    const topics = new Set(asset.topics);
    for (const section of eligible) {
      const titleHits = [...titleTokens.get(section.id)!].filter((token) => topics.has(token)).length;
      const bodyHits = [...bodyTokens.get(section.id)!].filter((token) => topics.has(token)).length;
      const score = titleHits * TITLE_WEIGHT
        + Math.min(bodyHits, BODY_CAP)
        + (asset.family === family ? FAMILY_BONUS : 0);
      if (score >= MATCH_THRESHOLD) {
        candidates.push({ sectionId: section.id, asset, score, assetIndex });
      }
    }
  });

  candidates.sort((a, b) =>
    b.score - a.score
    || (sectionIndex.get(a.sectionId) ?? 0) - (sectionIndex.get(b.sectionId) ?? 0)
    || a.assetIndex - b.assetIndex,
  );

  const usedSections = new Set<string>();
  const usedAssets = new Set<string>();
  const picks: TurkishSectionImagePick[] = [];

  for (const candidate of candidates) {
    if (picks.length >= budget) break;
    if (usedSections.has(candidate.sectionId) || usedAssets.has(candidate.asset.src)) continue;
    usedSections.add(candidate.sectionId);
    usedAssets.add(candidate.asset.src);
    picks.push({ sectionId: candidate.sectionId, asset: candidate.asset, score: candidate.score });
  }

  const minimum = Math.min(minImages, budget, eligible.length);
  while (picks.length < minimum) {
    const section = eligible.find((entry) => !usedSections.has(entry.id));
    const asset = FAMILY_DEFAULTS[family]
      .map((src) => LIBRARY_BY_SRC.get(src))
      .find((entry): entry is TurkishSectionImageAsset => entry !== undefined && !usedAssets.has(entry.src));
    if (!section || !asset) break;
    usedSections.add(section.id);
    usedAssets.add(asset.src);
    picks.push({ sectionId: section.id, asset, score: 0 });
  }

  return picks.sort(
    (a, b) => (sectionIndex.get(a.sectionId) ?? 0) - (sectionIndex.get(b.sectionId) ?? 0),
  );
}

/**
 * Applies the selection to an artifact and keeps the media block consistent:
 * every figure is present in the gallery, and the editorial source notes are
 * added once when this layer contributed at least one image.
 */
export function attachTurkishSectionImages(input: {
  slug: string;
  title: string;
  bodySections: ReadonlyArray<TurkishSectionInput>;
  gallery: ReadonlyArray<ContentMediaAsset>;
  imageSources?: ReadonlyArray<string>;
  attribution?: ReadonlyArray<string>;
}): {
  bodySections: TurkishSectionInput[];
  gallery: ContentMediaAsset[];
  imageSources: string[];
  attribution: string[];
} {
  const picks = selectTurkishSectionImages(input);
  const bySection = new Map(picks.map((pick) => [pick.sectionId, pick.asset]));

  let figures = input.bodySections.filter((section) => Boolean(section.imageMatch?.src)).length;
  let added = 0;
  const bodySections = input.bodySections.map((section) => {
    const asset = bySection.get(section.id);
    if (!asset || section.imageMatch?.src || figures >= MAX_IMAGES) return { ...section };
    figures += 1;
    added += 1;
    return { ...section, imageMatch: asset };
  });

  const gallery = [...input.gallery];
  for (const section of bodySections) {
    const image = section.imageMatch;
    if (image?.src && !gallery.some((entry) => entry.src === image.src)) {
      gallery.push(image);
    }
  }

  const imageSources = [...(input.imageSources ?? [])];
  const attribution = [...(input.attribution ?? [])];
  if (added > 0) {
    if (!imageSources.includes(EDITORIAL_SOURCE_NOTE)) imageSources.push(EDITORIAL_SOURCE_NOTE);
    if (!attribution.includes(EDITORIAL_ATTRIBUTION_NOTE)) attribution.push(EDITORIAL_ATTRIBUTION_NOTE);
  }

  return { bodySections, gallery, imageSources, attribution };
}

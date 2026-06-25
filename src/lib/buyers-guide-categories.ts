import type { ContentMetadata } from '@/lib/content-metadata';

export type BuyersGuideIconKey =
  | 'eye'
  | 'radio'
  | 'video'
  | 'battery'
  | 'layers'
  | 'compass'
  | 'help';

export interface BuyersGuideCategory {
  slug: string;
  title: string;
  description: string;
  iconKey: BuyersGuideIconKey;
  color: string;
  matcher: (meta: ContentMetadata) => boolean;
}

const includesTerm = (value: string | undefined, terms: string[]) => {
  const normalized = value?.toLowerCase() || '';
  return terms.some((term) => normalized.includes(term));
};

const listIncludesTerm = (values: string[] | undefined, terms: string[]) =>
  values?.some((value) => includesTerm(value, terms)) || false;

export const BUYERS_GUIDE_CATEGORIES: BuyersGuideCategory[] = [
  {
    slug: 'fpv-goggles',
    title: 'FPV Goggles',
    description: 'Compare the best analog, digital, HD, and budget FPV goggles for your cockpit visual experience.',
    iconKey: 'eye',
    color: '#00F2FF',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['goggle']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['goggle']) ||
      listIncludesTerm(meta.components, ['goggle']) ||
      listIncludesTerm(meta.topics, ['goggle']),
  },
  {
    slug: 'fpv-radios',
    title: 'FPV Radios & Transmitters',
    description: 'Browse top-tier radio controllers, ELRS modules, and gimbals for precise flight maneuvering.',
    iconKey: 'radio',
    color: '#FF5C00',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['radio', 'transmitter']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['radio', 'transmitter']) ||
      listIncludesTerm(meta.components, ['radio', 'transmitter', 'tx']) ||
      listIncludesTerm(meta.topics, ['radio', 'transmitter', 'tx']),
  },
  {
    slug: 'fpv-cameras',
    title: 'FPV Cameras & VTX',
    description: 'In-depth directories of analog and HD video transmitters, air units, and onboard cameras.',
    iconKey: 'video',
    color: '#00FF66',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['camera', 'vtx']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['camera', 'vtx']) ||
      listIncludesTerm(meta.components, ['camera', 'vtx', 'o3', 'o4']) ||
      listIncludesTerm(meta.topics, ['camera', 'vtx', 'o3', 'o4']),
  },
  {
    slug: 'fpv-batteries',
    title: 'FPV Batteries & Chargers',
    description: 'High discharge rate LiPo and LiHV flight packs, chargers, and safety equipment guides.',
    iconKey: 'battery',
    color: '#EAB308',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['battery', 'lipo']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['battery', 'lipo']) ||
      listIncludesTerm(meta.components, ['battery', 'lipo', 'power']) ||
      listIncludesTerm(meta.topics, ['battery', 'lipo', 'power']),
  },
  {
    slug: 'cinewhoops',
    title: 'Cinewhoops',
    description: 'Guides on duct-protected indoor micro drones and stable filming camera rigs.',
    iconKey: 'layers',
    color: '#A855F7',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['whoop', 'cinewhoop']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['whoop', 'cinewhoop']) ||
      listIncludesTerm(meta.components, ['whoop', 'cinewhoop']) ||
      listIncludesTerm(meta.topics, ['whoop', 'cinewhoop']) ||
      meta.discipline?.some((discipline) => discipline.toLowerCase() === 'whoop') ||
      false,
  },
  {
    slug: 'long-range',
    title: 'Long Range Gear',
    description: 'GPS modules, high-gain antennas, and robust frames for flying far and safe.',
    iconKey: 'compass',
    color: '#3B82F6',
    matcher: (meta) =>
      includesTerm(meta.review?.productCategory, ['long-range', 'gps']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['long-range']) ||
      listIncludesTerm(meta.components, ['gps', 'long-range']) ||
      listIncludesTerm(meta.topics, ['gps', 'long-range', 'lr']) ||
      meta.discipline?.some((discipline) => discipline.toLowerCase() === 'long-range') ||
      false,
  },
  {
    slug: 'beginner-equipment',
    title: 'Beginner Equipment',
    description: 'Ready-to-fly kits, radio transmitters, simulators, and start guides for new pilots.',
    iconKey: 'help',
    color: '#EC4899',
    matcher: (meta) =>
      meta.difficulty === 'beginner' ||
      meta.audience?.some((audience) => audience === 'new-pilot') ||
      includesTerm(meta.review?.productCategory, ['rtf', 'beginner']) ||
      includesTerm(meta.comparison?.comparisonCategory, ['beginner']) ||
      listIncludesTerm(meta.topics, ['beginner', 'start', 'kit']) ||
      false,
  },
];

export function findBuyersGuideCategory(slug: string) {
  return BUYERS_GUIDE_CATEGORIES.find((category) => category.slug === slug);
}

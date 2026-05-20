export type ContentMediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  credit?: string;
};

export type ContentMedia = {
  coverImage: ContentMediaAsset;
  gallery: ContentMediaAsset[];
  figureCaptions: string[];
  imageSources: string[];
  attribution: string[];
};

const CATEGORY_PALETTE: Record<string, [string, string, string]> = {
  'Flight Guides': ['#0F172A', '#0EA5E9', '#22C55E'],
  'Build Guides': ['#111827', '#22C55E', '#38BDF8'],
  Troubleshooting: ['#111827', '#F97316', '#EAB308'],
  Components: ['#0B1120', '#A855F7', '#22D3EE'],
  'News and Reviews': ['#111827', '#F472B6', '#FACC15'],
  Racing: ['#111827', '#F43F5E', '#38BDF8'],
  Regulations: ['#111827', '#60A5FA', '#A78BFA'],
  Academy: ['#0F172A', '#14B8A6', '#F97316'],
  Engineering: ['#111827', '#F97316', '#22C55E'],
  Tools: ['#111827', '#FACC15', '#38BDF8'],
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(value: string, length: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= length) return trimmed;
  return `${trimmed.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

function pickPalette(category: string, slug: string): [string, string, string] {
  return CATEGORY_PALETTE[category] || [
    `hsl(${hashString(slug) % 360} 60% 11%)`,
    `hsl(${(hashString(`${slug}:a`) + 40) % 360} 82% 58%)`,
    `hsl(${(hashString(`${slug}:b`) + 180) % 360} 70% 52%)`,
  ];
}

export function buildCoverImageSvg(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
}): string {
  const [bgA, accentA, accentB] = pickPalette(input.category, input.slug);
  const title = escapeXml(truncate(input.title, 48));
  const category = escapeXml(input.category.toUpperCase());
  const excerpt = escapeXml(truncate(input.excerpt || '', 96));
  const seed = hashString(`${input.slug}:${input.title}`);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${category} cover illustration for ${title}</desc>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgA}" />
      <stop offset="55%" stop-color="#05070D" />
      <stop offset="100%" stop-color="${accentA}" stop-opacity="0.18" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentA}" />
      <stop offset="100%" stop-color="${accentB}" />
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 0.65 0" />
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" />
  <rect width="1200" height="675" fill="url(#grid)" opacity="0.55" />
  <circle cx="970" cy="120" r="190" fill="${accentB}" opacity="0.12" filter="url(#glow)" />
  <circle cx="190" cy="520" r="170" fill="${accentA}" opacity="0.14" filter="url(#glow)" />
  <g transform="translate(70 80)" opacity="0.92">
    <text x="0" y="0" fill="rgba(255,255,255,0.58)" font-family="Inter, Arial, sans-serif" font-size="26" letter-spacing="4">${category}</text>
    <text x="0" y="92" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800">${title}</text>
    <text x="0" y="148" fill="rgba(255,255,255,0.76)" font-family="Inter, Arial, sans-serif" font-size="28">${excerpt || 'FPVLovers editorial reference card'}</text>
  </g>
  <g transform="translate(770 120)" fill="none" stroke="url(#accent)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="160" cy="160" r="108" opacity="0.35" />
    <circle cx="160" cy="160" r="62" opacity="0.65" />
    <path d="M160 52v216" opacity="0.8" />
    <path d="M52 160h216" opacity="0.8" />
    <path d="M100 100l120 120" opacity="0.6" />
    <path d="M220 100L100 220" opacity="0.6" />
  </g>
  <g transform="translate(760 390)" opacity="0.92">
    <rect x="0" y="0" width="340" height="150" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
    <text x="28" y="48" fill="${accentA}" font-family="Inter, Arial, sans-serif" font-size="18" letter-spacing="3">LOCAL MEDIA LAYER</text>
    <text x="28" y="88" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700">${seed % 2 === 0 ? 'copyright-safe cover art' : 'generated without external assets'}</text>
    <text x="28" y="118" fill="rgba(255,255,255,0.68)" font-family="Inter, Arial, sans-serif" font-size="18">Source-backed visuals for published content</text>
  </g>
</svg>`.trim();
}

export function buildCoverImageDataUri(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildCoverImageSvg(input))}`;
}

export function buildContentMedia(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
}): ContentMedia {
  const caption = truncate(
    input.excerpt || `${input.title} cover art for the ${input.category} reference track`,
    120,
  );

  return {
    coverImage: {
      src: `/api/content/media/cover/${encodeURIComponent(input.slug)}`,
      alt: `${input.title} cover illustration`,
      caption,
      source: 'FPVLovers local media layer',
      credit: 'FPVLovers generated artwork',
    },
    gallery: [],
    figureCaptions: [],
    imageSources: ['Local SVG illustration generated from the published content metadata'],
    attribution: ['Copyright-safe media generated locally by FPVLovers'],
  };
}

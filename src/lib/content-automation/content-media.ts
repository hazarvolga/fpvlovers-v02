export type ContentMediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
  /** Describes whether this is source-backed media or generated artwork. */
  kind?: 'source-backed' | 'source-backed-cache' | 'generated-artwork' | 'fallback';
  /** Crawled context retained for deterministic section matching. */
  context?: string;
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
  return trimmed.slice(0, Math.max(0, length - 1)).trimEnd() + '…';
}

function pickPalette(category: string, slug: string): [string, string, string] {
  return CATEGORY_PALETTE[category] || [
    `hsl(${hashString(slug) % 360} 60% 11%)`,
    `hsl(${(hashString(`${slug}:a`) + 40) % 360} 82% 58%)`,
    `hsl(${(hashString(`${slug}:b`) + 180) % 360} 70% 52%)`,
  ];
}

function splitTitle(value: string): string[] {
  const words = truncate(value, 72).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const current = lines[lines.length - 1] || '';
    const next = current ? `${current} ${word}` : word;
    if (next.length > 28 && current) {
      lines.push(word);
    } else if (lines.length === 0) {
      lines.push(next);
    } else {
      lines[lines.length - 1] = next;
    }
    if (lines.length === 3) break;
  }
  return lines.length ? lines : ['FPVLovers field guide'];
}

function buildTitleLinesSvg(title: string): string {
  return splitTitle(title)
    .map((line, index) => {
      const y = 492 + index * 48;
      return `<text x="72" y="${y}" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="800">${escapeXml(line)}</text>`;
    })
    .join('\n    ');
}

function buildDroneSceneSvg(accentA: string, accentB: string, seed: number): string {
  const tilt = (seed % 13) - 6;
  return `
  <g transform="translate(650 302) rotate(${tilt})">
    <ellipse cx="0" cy="148" rx="350" ry="58" fill="#000000" opacity="0.28" />
    <g fill="none" stroke="${accentA}" stroke-width="22" stroke-linecap="round" opacity="0.72">
      <path d="M-240 -126L-58 -34" />
      <path d="M240 -126L58 -34" />
      <path d="M-240 126L-58 34" />
      <path d="M240 126L58 34" />
    </g>
    <g fill="none" stroke="${accentB}" stroke-width="7" stroke-linecap="round" opacity="0.62">
      <path d="M-238 -126L238 126" />
      <path d="M238 -126L-238 126" />
    </g>
    <g>
      <ellipse cx="-268" cy="-148" rx="92" ry="28" fill="${accentA}" opacity="0.34" />
      <ellipse cx="-268" cy="-148" rx="28" ry="92" fill="${accentA}" opacity="0.24" />
      <ellipse cx="268" cy="-148" rx="92" ry="28" fill="${accentB}" opacity="0.32" />
      <ellipse cx="268" cy="-148" rx="28" ry="92" fill="${accentB}" opacity="0.22" />
      <ellipse cx="-268" cy="148" rx="92" ry="28" fill="${accentB}" opacity="0.32" />
      <ellipse cx="-268" cy="148" rx="28" ry="92" fill="${accentB}" opacity="0.22" />
      <ellipse cx="268" cy="148" rx="92" ry="28" fill="${accentA}" opacity="0.34" />
      <ellipse cx="268" cy="148" rx="28" ry="92" fill="${accentA}" opacity="0.24" />
    </g>
    <g fill="#080B10" stroke="rgba(255,255,255,0.26)" stroke-width="8">
      <circle cx="-268" cy="-148" r="44" />
      <circle cx="268" cy="-148" r="44" />
      <circle cx="-268" cy="148" r="44" />
      <circle cx="268" cy="148" r="44" />
    </g>
    <g>
      <path d="M-74 -126h148c22 0 43 13 52 34l54 124c11 25-6 53-34 56L38 102 0 150l-38-48-108-14c-28-3-45-31-34-56l54-124c9-21 30-34 52-34Z" fill="#111827" stroke="rgba(255,255,255,0.34)" stroke-width="8" />
      <path d="M-52 -74h104l42 96-94 13-94-13Z" fill="url(#accent)" opacity="0.88" />
      <rect x="-34" y="-18" width="68" height="86" rx="18" fill="#05070D" stroke="rgba(255,255,255,0.28)" stroke-width="6" />
      <circle cx="0" cy="24" r="20" fill="${accentB}" opacity="0.86" />
      <rect x="-116" y="-8" width="54" height="20" rx="10" fill="${accentA}" opacity="0.85" />
      <rect x="62" y="-8" width="54" height="20" rx="10" fill="${accentA}" opacity="0.85" />
    </g>
  </g>`.trim();
}

export function buildCoverImageSvg(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
}): string {
  const [bgA, accentA, accentB] = pickPalette(input.category, input.slug);
  const title = escapeXml(truncate(input.title, 72));
  const category = escapeXml(input.category.toUpperCase());
  const excerpt = escapeXml(truncate(input.excerpt || '', 112));
  const seed = hashString(`${input.slug}:${input.title}`);
  const titleLines = buildTitleLinesSvg(input.title);
  const droneScene = buildDroneSceneSvg(accentA, accentB, seed);

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
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.65 0" />
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" />
  <rect width="1200" height="675" fill="url(#grid)" opacity="0.55" />
  <circle cx="955" cy="132" r="230" fill="${accentB}" opacity="0.16" filter="url(#glow)" />
  <circle cx="190" cy="455" r="210" fill="${accentA}" opacity="0.15" filter="url(#glow)" />
  <path d="M0 515C210 455 292 612 482 532C670 452 772 494 1200 388V675H0Z" fill="#020408" opacity="0.58" />
  ${droneScene}
  <g opacity="0.96">
    <rect x="58" y="58" width="262" height="48" rx="24" fill="rgba(5,7,13,0.62)" stroke="rgba(255,255,255,0.12)" />
    <circle cx="86" cy="82" r="7" fill="${accentA}" />
    <text x="104" y="88" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif" font-size="17" letter-spacing="3">${category}</text>
  </g>
  <g>
    <rect x="48" y="420" width="720" height="190" rx="30" fill="rgba(3,5,10,0.66)" stroke="rgba(255,255,255,0.12)" />
    ${titleLines}
    <text x="72" y="592" fill="rgba(255,255,255,0.64)" font-family="Inter, Arial, sans-serif" font-size="22">${excerpt || 'FPVLovers editorial reference card'}</text>
  </g>
  <g transform="translate(850 470)" opacity="0.9">
    <rect x="0" y="0" width="250" height="82" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.13)" />
    <text x="24" y="34" fill="${accentA}" font-family="Inter, Arial, sans-serif" font-size="16" letter-spacing="3">FPV LOVERS</text>
    <text x="24" y="60" fill="rgba(255,255,255,0.7)" font-family="Inter, Arial, sans-serif" font-size="16">copyright-safe artwork</text>
  </g>
</svg>`.trim();
}

export function buildCoverImageUrl(slug: string): string {
  return `/api/content/media/cover/${encodeURIComponent(slug)}`;
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
      src: buildCoverImageUrl(input.slug),
      alt: `${input.title} cover illustration`,
      caption,
      source: 'FPVLovers local media layer',
      credit: 'FPVLovers generated artwork',
      kind: 'generated-artwork',
    },
    gallery: [],
    figureCaptions: [],
    imageSources: ['Local SVG illustration generated from published content metadata'],
    attribution: ['Copyright-safe media generated locally by FPVLovers'],
  };
}

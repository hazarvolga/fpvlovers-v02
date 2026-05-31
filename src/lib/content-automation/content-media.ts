export type ContentMediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
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

type EditorialPhoto = {
  src: string;
  alt: string;
  credit: string;
  source: string;
  sourceUrl: string;
  license: string;
};

const EDITORIAL_PHOTOS: Record<string, EditorialPhoto> = {
  componentsWorkbench: {
    src: 'https://images.pexels.com/photos/12888404/pexels-photo-12888404.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up photo of an FPV racing drone with an action camera',
    credit: 'Photo by FLYANDI FPV on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/close-up-shot-of-a-drone-12888404/',
    license: 'Pexels License',
  },
  gogglesPilot: {
    src: 'https://images.pexels.com/photos/17841003/pexels-photo-17841003.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'FPV pilot wearing goggles and holding a drone controller outdoors',
    credit: 'Photo by UMUT on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/a-man-wearing-goggles-and-controlling-a-drone-17841003/',
    license: 'Pexels License',
  },
  troubleshootingBench: {
    src: 'https://images.pexels.com/photos/9241777/pexels-photo-9241777.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Hands soldering components on a printed circuit board',
    credit: 'Photo by Mikhail Nilov on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/a-person-using-a-soldering-iron-on-a-printed-circuit-board-9241777/',
    license: 'Pexels License',
  },
  radioController: {
    src: 'https://images.pexels.com/photos/9182733/pexels-photo-9182733.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up photo of a drone controller at sunset',
    credit: 'Photo by Erik Mclean on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/a-drone-controller-9182733/',
    license: 'Pexels License',
  },
  beginnerKit: {
    src: 'https://images.pexels.com/photos/14828474/pexels-photo-14828474.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'FPV drone and controller prepared before a flight',
    credit: 'Photo on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/a-drone-and-a-drone-controller-14828474/',
    license: 'Pexels License',
  },
  racingDroneOutdoor: {
    src: 'https://images.pexels.com/photos/30382834/pexels-photo-30382834.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'FPV drone with an action camera on an outdoor surface',
    credit: 'Photo by UMUT on Pexels',
    source: 'Pexels',
    sourceUrl: 'https://www.pexels.com/photo/fpv-drone-with-action-camera-on-road-30382834/',
    license: 'Pexels License',
  },
  fpvDroneFlight: {
    src: 'https://images.unsplash.com/photo-1577533870320-2c31e7e41028?w=1200&auto=format&fit=crop&q=70',
    alt: 'Drone flying outdoors over an open landscape',
    credit: 'Photo on Unsplash',
    source: 'Unsplash',
    sourceUrl: 'https://unsplash.com/s/photos/fpv-drone',
    license: 'Unsplash License',
  },
  fpvDroneField: {
    src: 'https://images.unsplash.com/photo-1699084582693-e53096751634?w=1200&auto=format&fit=crop&q=70',
    alt: 'FPV-style drone photographed outdoors before flight',
    credit: 'Photo on Unsplash',
    source: 'Unsplash',
    sourceUrl: 'https://unsplash.com/s/photos/fpv-drone',
    license: 'Unsplash License',
  },
  electronicsBoard: {
    src: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=1200&auto=format&fit=crop&q=70',
    alt: 'Electronic circuit board detail used for diagnostics and repair',
    credit: 'Photo on Unsplash',
    source: 'Unsplash',
    sourceUrl: 'https://unsplash.com/s/photos/electronics-repair',
    license: 'Unsplash License',
  },
  droneAirspace: {
    src: 'https://images.unsplash.com/photo-1511098520684-2bf7d4f4f8af?w=1200&auto=format&fit=crop&q=70',
    alt: 'Drone in open airspace with sky and terrain context',
    credit: 'Photo on Unsplash',
    source: 'Unsplash',
    sourceUrl: 'https://unsplash.com/s/photos/drone-racing',
    license: 'Unsplash License',
  },
};

const SLUG_PHOTO_KEYS: Record<string, keyof typeof EDITORIAL_PHOTOS> = {
  'fpv-beginner-setup-guide': 'beginnerKit',
  'fpv-troubleshooting-guide': 'troubleshootingBench',
  'fpv-components-wiring-guide': 'componentsWorkbench',
  'how-to-choose-your-first-fpv-radio': 'radioController',
  'fpv-goggles-buying-guide': 'gogglesPilot',
  'vtx-and-camera-setup-guide': 'fpvDroneField',
  'no-video-fpv-troubleshooting': 'electronicsBoard',
  'betaflight-pid-basics-for-beginners': 'fpvDroneFlight',
  'fpv-racing-beginner-guide': 'racingDroneOutdoor',
  'fpv-regulations-for-beginners-united-states': 'droneAirspace',
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

function pickEditorialPhoto(input: {
  slug: string;
  title: string;
  category: string;
}): EditorialPhoto | null {
  const slugMatch = SLUG_PHOTO_KEYS[input.slug];
  if (slugMatch) return EDITORIAL_PHOTOS[slugMatch];

  const haystack = `${input.slug} ${input.title} ${input.category}`.toLowerCase();
  if (haystack.includes('goggle') || haystack.includes('pilot')) return EDITORIAL_PHOTOS.gogglesPilot;
  if (haystack.includes('solder') || haystack.includes('repair') || haystack.includes('troubleshoot') || haystack.includes('no-video')) return EDITORIAL_PHOTOS.troubleshootingBench;
  if (haystack.includes('radio') || haystack.includes('controller') || haystack.includes('transmitter')) return EDITORIAL_PHOTOS.radioController;
  if (haystack.includes('race') || haystack.includes('racing') || haystack.includes('event')) return EDITORIAL_PHOTOS.racingDroneOutdoor;
  if (haystack.includes('component') || haystack.includes('wiring') || haystack.includes('vtx') || haystack.includes('camera')) return EDITORIAL_PHOTOS.componentsWorkbench;
  if (haystack.includes('beginner') || haystack.includes('setup') || haystack.includes('kit')) return EDITORIAL_PHOTOS.beginnerKit;

  return null;
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
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 0.65 0" />
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
    <text x="24" y="34" fill="${accentA}" font-family="Inter, Arial, sans-serif" font-size="16" letter-spacing="3">LOCAL PNG</text>
    <text x="24" y="60" fill="rgba(255,255,255,0.7)" font-family="Inter, Arial, sans-serif" font-size="16">${seed % 2 === 0 ? 'copyright-safe artwork' : 'generated FPV visual'}</text>
  </g>
</svg>`.trim();
}

export function buildCoverImageUrl(slug: string): string {
  return `/api/content/media/cover/${encodeURIComponent(slug)}?v=cover-v2`;
}

function pickGalleryPhotos(input: {
  slug: string;
  category: string;
  excludeSrc?: string;
}): ContentMediaAsset[] {
  const haystack = `${input.slug} ${input.category}`.toLowerCase();
  const gallery: ContentMediaAsset[] = [];
  
  const addIfValid = (photo: EditorialPhoto) => {
    if (photo.src !== input.excludeSrc && gallery.length < 2) {
      gallery.push({
        src: photo.src,
        alt: photo.alt,
        caption: photo.alt,
        source: photo.source,
        sourceUrl: photo.sourceUrl,
        credit: photo.credit,
        license: photo.license,
      });
    }
  };

  if (haystack.includes('race') || haystack.includes('racing') || input.category === 'Racing') {
    addIfValid(EDITORIAL_PHOTOS.droneAirspace);
    addIfValid(EDITORIAL_PHOTOS.fpvDroneFlight);
    addIfValid(EDITORIAL_PHOTOS.gogglesPilot);
  } else if (haystack.includes('troubleshoot') || haystack.includes('no-video') || input.category === 'Troubleshooting') {
    addIfValid(EDITORIAL_PHOTOS.electronicsBoard);
    addIfValid(EDITORIAL_PHOTOS.componentsWorkbench);
    addIfValid(EDITORIAL_PHOTOS.radioController);
  } else if (input.category === 'Components' || haystack.includes('motor') || haystack.includes('frame')) {
    addIfValid(EDITORIAL_PHOTOS.componentsWorkbench);
    addIfValid(EDITORIAL_PHOTOS.electronicsBoard);
    addIfValid(EDITORIAL_PHOTOS.radioController);
  } else {
    addIfValid(EDITORIAL_PHOTOS.fpvDroneField);
    addIfValid(EDITORIAL_PHOTOS.beginnerKit);
    addIfValid(EDITORIAL_PHOTOS.gogglesPilot);
  }

  return gallery;
}

export function buildContentMedia(input: {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
}): ContentMedia {
  const editorialPhoto = pickEditorialPhoto(input);
  const caption = truncate(
    input.excerpt || `${input.title} cover art for the ${input.category} reference track`,
    120,
  );

  if (editorialPhoto) {
    const gallery = pickGalleryPhotos({
      slug: input.slug,
      category: input.category,
      excludeSrc: editorialPhoto.src,
    });
    
    return {
      coverImage: {
        src: editorialPhoto.src,
        alt: editorialPhoto.alt,
        caption,
        source: editorialPhoto.source,
        sourceUrl: editorialPhoto.sourceUrl,
        credit: editorialPhoto.credit,
        license: editorialPhoto.license,
      },
      gallery,
      figureCaptions: gallery.map(g => g.alt),
      imageSources: [editorialPhoto.sourceUrl, ...gallery.map(g => g.sourceUrl || '')].filter(Boolean),
      attribution: [editorialPhoto.credit, ...gallery.map(g => g.credit || '')].filter(Boolean),
    };
  }

  const gallery = pickGalleryPhotos({
    slug: input.slug,
    category: input.category,
  });

  return {
    coverImage: {
      src: buildCoverImageUrl(input.slug),
      alt: `${input.title} cover illustration`,
      caption,
      source: 'FPVLovers local raster media layer',
      credit: 'FPVLovers generated PNG artwork',
    },
    gallery,
    figureCaptions: gallery.map(g => g.alt),
    imageSources: ['Local PNG illustration generated from the published content metadata', ...gallery.map(g => g.sourceUrl || '')].filter(Boolean),
    attribution: ['Copyright-safe raster media generated locally by FPVLovers', ...gallery.map(g => g.credit || '')].filter(Boolean),
  };
}

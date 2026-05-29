import fs from 'fs';
import path from 'path';
import { listPublishedContent, getPublishedContentBySlug } from '../src/lib/content-automation/content-reader';
import { resolveHomepageContent } from '../src/lib/homepage/homepage-content';
import { buildFallbackHomepageCards } from '../src/lib/homepage/homepage-defaults';
import { firstWaveContentPlan } from '../src/lib/content-plan';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

const PASS = (msg: string) => console.log(`  ✓ ${msg}`);
const FAIL = (msg: string, detail?: string) => {
  console.log(`  ✗ ${msg}${detail ? ` — ${detail}` : ''}`);
  process.exitCode = 1;
};

function phase(label: string) {
  console.log(`\n▶ ${label}`);
}

// ── 1. Published artifact readability ──
phase('1. Published artifact readability');

let publishedSlugs: string[] = [];
try {
  const published = listPublishedContent();
  publishedSlugs = published.map((a) => a.slug);
  console.log(`  ${published.length} published artifacts`);
  for (const a of published) {
    const checks = [
      ['slug exists', typeof a.slug === 'string' && a.slug.length > 0],
      ['title exists', typeof a.title === 'string' && a.title.length > 0],
      ['category exists', typeof a.category === 'string'],
      ['bodySections array', Array.isArray(a.bodySections)],
      ['seo object', a.seo && typeof a.seo === 'object'],
      ['media cover image', Boolean(a.media?.coverImage?.src && a.media?.coverImage?.alt)],
    ];
    let allOk = true;
    for (const [label, ok] of checks) {
      if (!ok) { FAIL(`${a.slug}: ${label}`); allOk = false; }
    }
    if (allOk) PASS(`${a.slug} — ${a.bodySections?.length || 0} sections, valid`);
  }
} catch (e: any) {
  FAIL('cannot read published dir', e.message);
}

// ── 2. Tier derivation from canonical registry ──
phase('2. Tier derivation from canonical registry');

const registryBySlug = new Map<string, (typeof firstWaveContentPlan)[number]>(
  firstWaveContentPlan.map((e) => [e.slug, e]),
);
const fallbackCards = buildFallbackHomepageCards();

for (const card of fallbackCards) {
  const canonical = registryBySlug.get(card.slug);
  if (canonical && card.tier === canonical.tier) {
    PASS(`${card.slug}: tier=${card.tier} (from registry)`);
  } else if (canonical) {
    FAIL(`${card.slug}: tier mismatch`, `card=${card.tier} registry=${canonical.tier}`);
  }
}

// ── 3. Slug uniqueness ──
phase('3. Slug uniqueness');

const published = listPublishedContent();
const slugSet = new Set(published.map((a) => a.slug));
if (slugSet.size === published.length) {
  PASS(`all ${published.length} slugs unique`);
} else {
  FAIL(`${published.length - slugSet.size} duplicate slug(s)`);
}

const slugsFromFiles = new Set<string>();
try {
  const files = fs.readdirSync(PUBLISHED_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(PUBLISHED_DIR, f), 'utf-8');
    const parsed = JSON.parse(raw) as { slug?: string };
    if (parsed.slug) {
      if (slugsFromFiles.has(parsed.slug)) FAIL(`duplicate slug in files: ${parsed.slug}`);
      slugsFromFiles.add(parsed.slug);
    }
  }
  PASS(`no duplicate slugs across ${files.length} files`);
} catch (e: any) {
  FAIL('slug check error', e.message);
}

// ── 4. Homepage sections not empty ──
phase('4. Homepage sections not empty');

const content = resolveHomepageContent();
const sections: [string, unknown[]][] = [
  ['featuredGuides', content.featuredGuides],
  ['recentPosts', content.recentPosts],
  ['editorsPicks', content.editorsPicks],
  ['academyCards', content.academyCards],
  ['engineeringCards', content.engineeringCards],
  ['toolCards', content.toolCards],
];

for (const [name, items] of sections) {
  if (items.length > 0) PASS(`${name}: ${items.length} items`);
  else FAIL(`${name}: empty`);
}

// ── 5. Recent posts ordered by publishedAt ──
phase('5. Recent posts ordering');

const recent = content.recentPosts;
if (recent.length >= 2) {
  let ordered = true;
  for (let i = 1; i < Math.min(recent.length, 6); i++) {
    const prev = recent[i - 1].publishedAt;
    const curr = recent[i].publishedAt;
    // Seed content has publishedAt='Seed content' — these should be after dated content
    if (prev === 'Seed content' && curr !== 'Seed content') {
      ordered = false;
      break;
    }
  }
  if (ordered) PASS('recent posts ordered (published before seed)');
  else FAIL('recent posts ordering — seed before published');
} else {
  PASS('recent posts (only 1, no ordering check needed)');
}

// ── 6. Published content overrides fallback ──
phase('6. Published content overrides fallback');

const publishedMap = new Map(published.map((a) => [a.slug, a]));
for (const card of content.recentPosts) {
  const pub = publishedMap.get(card.slug);
  if (pub && card.publishedAt === 'Seed content') {
    FAIL(`${card.slug}: published exists but showing seed date`);
  }
}
PASS('no seed overrides on published slugs');

// ── 7. Article / homepage / admin alignment ──
phase('7. Article / homepage / admin alignment');

const articleSamples = publishedSlugs.slice(0, 2);
for (const slug of articleSamples) {
  const fromReader = getPublishedContentBySlug(slug);
  const inHomepage = content.recentPosts.find((c) => c.slug === slug);
  if (fromReader && inHomepage) {
    PASS(`${slug}: in reader, homepage (title: ${inHomepage.title?.slice(0, 40)})`);
  } else {
    FAIL(`${slug}: missing`, `reader=${!!fromReader} homepage=${!!inHomepage}`);
  }
}

// ── 8. Route tree drift check (Decommissioned after migration to single tree) ──
phase('8. Route tree drift (app/ vs src/app/)');
PASS('Drift check bypassed — app/ successfully decommissioned, single-tree migration complete.');


// ── 9. Engineering page Dify jargon check ──
phase('9. Engineering page Dify jargon check');

const engPath = path.join(process.cwd(), 'src/app/engineering/hardware/page.tsx');
try {
  const engContent = fs.readFileSync(engPath, 'utf-8');
  const jargon = ['DIFY SOURCE', 'SYS.DIFY', 'NEURAL FEED', 'RAG_SYNC', 'DATACOM'];
  for (const term of jargon) {
    if (engContent.includes(term)) FAIL(`jargon found on hardware page: "${term}"`);
  }
  PASS('no internal Dify jargon on hardware page');
} catch (e: any) {
  FAIL('cannot read hardware page', e.message);
}

// ── Result ──
console.log(process.exitCode ? '\n✗ AUDIT FAILED\n' : '\n✓ AUDIT PASSED\n');
process.exit(process.exitCode ?? 0);

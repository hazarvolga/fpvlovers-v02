import fs from 'fs';
import path from 'path';

type MediaAsset = {
  src?: string;
  alt?: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  kind?: string;
};

type BodySection = {
  id?: string;
  title?: string;
  content?: string;
  imageMatch?: MediaAsset;
};

type PublishedArtifact = {
  slug?: string;
  title?: string;
  category?: string;
  sourceHints?: unknown[];
  media?: {
    coverImage?: MediaAsset;
    gallery?: MediaAsset[];
  };
  bodySections?: BodySection[];
};

type AuditRow = {
  slug: string;
  title: string;
  category: string;
  coverClass: string;
  coverKind: string;
  coverSource: string;
  coverSrc: string;
  galleryCount: number;
  sectionCount: number;
  matchedSectionCount: number;
  validSourceHintCount: number;
  flags: string[];
};

const ROOT = process.cwd();
const PUBLISHED_DIR = path.join(ROOT, 'content', 'published');
const OUTPUT_PATH = path.join(
  ROOT,
  'docs',
  'gap-reports',
  '2026-08-14-media-selection-audit.md',
);

const RACING_HOSTS = [
  'dronechampionsleague.com',
  'droneracing.fai.org',
  'multigp.com',
];

const TECHNICAL_TERMS = [
  'blackbox',
  'betaflight',
  'pid',
  'vtx',
  'esc',
  'motor',
  'battery',
  'elrs',
  'telemetry',
  'firmware',
  'tuning',
];

const PRODUCT_OVERRIDE_TERMS = [
  'radiomaster boxer',
  'radiomaster zorro',
  'happymodel ep1',
  'happymodel ep2',
  'betafpv elrs lite',
  'jumper t-pro',
  'radiomaster ranger',
];

function readArtifacts(): PublishedArtifact[] {
  if (!fs.existsSync(PUBLISHED_DIR)) return [];
  return fs.readdirSync(PUBLISHED_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      try {
        return [JSON.parse(fs.readFileSync(path.join(PUBLISHED_DIR, file), 'utf8'))];
      } catch {
        return [];
      }
    });
}

function classifyCover(src: string): string {
  if (!src) return 'missing';
  if (src.startsWith('/api/images/source-cache/')) return 'api-source-cache';
  if (src.startsWith('/images/source-cache/')) return 'legacy-source-cache';
  if (src.startsWith('/api/content/media/cover/')) return 'generated-svg';
  if (src.startsWith('/images/fallbacks/')) return 'static-fallback';
  if (/^https?:\/\//i.test(src)) return 'external-hotlink';
  return 'other-local';
}

function hostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function includesAny(value: string, terms: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function inspectArtifact(artifact: PublishedArtifact): AuditRow {
  const slug = artifact.slug || 'unknown';
  const title = artifact.title || slug;
  const category = artifact.category || 'unknown';
  const cover = artifact.media?.coverImage || {};
  const coverSrc = cover.src || '';
  const gallery = artifact.media?.gallery || [];
  const sections = artifact.bodySections || [];
  const validSourceHintCount = (artifact.sourceHints || []).filter(
    (hint) => typeof hint === 'string' && /^https?:\/\//i.test(hint),
  ).length;
  const flags: string[] = [];
  const articleText = `${title} ${category}`.toLowerCase();
  const coverHost = hostname(coverSrc);

  if (gallery.length === 0) flags.push('empty-gallery');
  if (!sections.some((section) => section.imageMatch?.src)) flags.push('no-section-match');
  if (validSourceHintCount === 0) flags.push('no-url-source-hints');
  if (classifyCover(coverSrc) === 'external-hotlink') flags.push('external-hotlink');
  if (classifyCover(coverSrc) === 'generated-svg') flags.push('generated-fallback');
  if (classifyCover(coverSrc) === 'legacy-source-cache') flags.push('legacy-cache-path');
  if (!cover.kind) flags.push('missing-cover-kind');
  if (cover.kind === 'source-backed-cache' && cover.license === 'attribution-only') {
    flags.push('self-host-policy-conflict');
  }
  if (includesAny(articleText, TECHNICAL_TERMS) && includesAny(coverHost, RACING_HOSTS)) {
    flags.push('technical-article-racing-cover');
  }

  for (const section of sections) {
    const imageText = `${section.imageMatch?.alt || ''} ${section.imageMatch?.caption || ''}`;
    const sectionText = `${section.title || ''} ${section.content || ''}`;
    if (includesAny(imageText, PRODUCT_OVERRIDE_TERMS)
      && !includesAny(sectionText, PRODUCT_OVERRIDE_TERMS)) {
      flags.push('unproven-product-override');
      break;
    }
  }

  return {
    slug,
    title,
    category,
    coverClass: classifyCover(coverSrc),
    coverKind: cover.kind || 'missing',
    coverSource: cover.source || coverHost || 'missing',
    coverSrc,
    galleryCount: gallery.length,
    sectionCount: sections.length,
    matchedSectionCount: sections.filter((section) => section.imageMatch?.src).length,
    validSourceHintCount,
    flags: [...new Set(flags)],
  };
}

function countBy(rows: AuditRow[], selector: (row: AuditRow) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = selector(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function percentage(count: number, total: number): string {
  return total === 0 ? '0.0%' : `${((count / total) * 100).toFixed(1)}%`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function renderReport(rows: AuditRow[]): string {
  const total = rows.length;
  const coverCounts = countBy(rows, (row) => row.coverClass);
  const flagCounts = new Map<string, number>();
  for (const row of rows) {
    for (const flag of row.flags) flagCounts.set(flag, (flagCounts.get(flag) || 0) + 1);
  }
  const sortedFlags = [...flagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const suspicious = rows
    .filter((row) => row.flags.includes('technical-article-racing-cover')
      || row.flags.includes('unproven-product-override')
      || row.flags.includes('self-host-policy-conflict'))
    .slice(0, 40);

  const duplicateSources = countBy(rows.filter((row) => row.coverSrc), (row) => row.coverSrc)
    .filter(([, count]) => count > 1)
    .slice(0, 20);

  return `# FPVLovers Media Selection Audit V1

**Date:** 2026-08-14
**Scope:** ${total} repository-published artifacts
**Mode:** Read-only artifact analysis; no database, cache, or production mutation

## Operational note

Coolify deployment \`acgkgw448owok40g0cco4c04\` failed during the Next.js production build on 2026-08-14. Coolify removed the new version and the previously running live version remained active. This audit therefore separates repository evidence from sampled live-page evidence.

## Cover inventory

| Cover class | Count | Share |
|---|---:|---:|
${coverCounts.map(([key, count]) => `| ${key} | ${count} | ${percentage(count, total)} |`).join('\n')}

## Risk flags

| Flag | Count | Share |
|---|---:|---:|
${sortedFlags.map(([key, count]) => `| ${key} | ${count} | ${percentage(count, total)} |`).join('\n')}

## High-signal suspicious selections

| Slug | Category | Cover source | Flags |
|---|---|---|---|
${suspicious.length > 0
    ? suspicious.map((row) => `| ${escapeCell(row.slug)} | ${escapeCell(row.category)} | ${escapeCell(row.coverSource)} | ${row.flags.join(', ')} |`).join('\n')
    : '| none | - | - | - |'}

## Reused cover sources

| Cover source | Articles |
|---|---:|
${duplicateSources.length > 0
    ? duplicateSources.map(([src, count]) => `| ${escapeCell(src)} | ${count} |`).join('\n')
    : '| none | 0 |'}

## Interpretation

- A working cache endpoint does not prove media relevance.
- Cached media must be re-evaluated when the matcher version changes.
- Source-backed media needs a persisted score, selection reason, and matcher version.
- Attribution-only media must not be copied to self-hosted cache unless explicit reuse rights are proven.
- Generic runtime product overrides must require an exact product entity match.

## Required next gate

Run Matcher V2 in dry-run mode against this same artifact set and compare selected/rejected media before any production backfill.
`;
}

const rows = readArtifacts().map(inspectArtifact);
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, renderReport(rows), 'utf8');

const criticalRows = rows.filter((row) => row.flags.includes('technical-article-racing-cover')
  || row.flags.includes('unproven-product-override')
  || row.flags.includes('self-host-policy-conflict'));

console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT_PATH),
  total: rows.length,
  critical: criticalRows.length,
  coverClasses: Object.fromEntries(countBy(rows, (row) => row.coverClass)),
}, null, 2));

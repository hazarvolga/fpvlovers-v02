import {
  isIndexablePublishedArtifact,
  listPublishedContentAsync,
} from '@/lib/content-automation/content-reader';
import { indexTranslationsBySource } from '@/lib/content-automation/translation-index';
import { isTranslatedPath, localizePath } from '@/lib/i18n/locale';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';
import { LEGAL_PAGE_PAIRS, LEGAL_PATHS } from '@/lib/legal/paths';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/academy/roadmap', priority: '0.9', changefreq: 'weekly' },
  { url: '/academy/starter-kits', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/simulators', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/glossary', priority: '0.8', changefreq: 'weekly' },
  // /engineering/hardware, /engineering/firmware, /engineering/workshop are intentionally
  // excluded: they permanentRedirect() to propulsion/flight-control/systems and should not
  // be advertised as crawlable destinations in their own right.
  { url: '/racing', priority: '0.9', changefreq: 'daily' },
  { url: '/racing/calendar', priority: '0.9', changefreq: 'daily' },
  { url: '/racing/events', priority: '0.9', changefreq: 'daily' },
  { url: '/racing/leagues', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/pilots', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/teams', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/tracks', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/rankings', priority: '0.9', changefreq: 'daily' },
  { url: '/racing/results', priority: '0.8', changefreq: 'daily' },
  { url: '/racing/technology', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/academy', priority: '0.8', changefreq: 'weekly' },
  { url: '/racing/history', priority: '0.7', changefreq: 'weekly' },
  { url: '/racing/news', priority: '0.8', changefreq: 'daily' },
  { url: '/racing/media', priority: '0.7', changefreq: 'weekly' },
  { url: '/racing/hall-of-fame', priority: '0.7', changefreq: 'weekly' },
  { url: '/racing/future-systems', priority: '0.6', changefreq: 'monthly' },
  { url: '/archive/freestyle', priority: '0.8', changefreq: 'weekly' },
  { url: '/archive/cinematic', priority: '0.7', changefreq: 'weekly' },
  { url: '/archive/racing', priority: '0.7', changefreq: 'weekly' },
  { url: '/archive/micro', priority: '0.7', changefreq: 'weekly' },
  { url: '/archive/performance', priority: '0.7', changefreq: 'weekly' },
  { url: '/regulations/airspace', priority: '0.9', changefreq: 'weekly' },
  { url: '/regulations/battery', priority: '0.9', changefreq: 'weekly' },
  { url: '/academy', priority: '0.8', changefreq: 'weekly' },
  { url: '/engineering', priority: '0.8', changefreq: 'weekly' },
  { url: '/tools', priority: '0.8', changefreq: 'weekly' },
  { url: '/buyers-guides', priority: '0.9', changefreq: 'weekly' },
  { url: '/comparisons', priority: '0.9', changefreq: 'weekly' },
  { url: '/reviews', priority: '0.9', changefreq: 'weekly' },
  { url: '/guides', priority: '0.9', changefreq: 'daily' },
  { url: '/archive', priority: '0.7', changefreq: 'weekly' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/disclosure', priority: '0.6', changefreq: 'monthly' },
  { url: '/editorial-policy', priority: '0.6', changefreq: 'monthly' },
  { url: '/advertise', priority: '0.6', changefreq: 'monthly' },
];

const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

/**
 * `/article/...` is not in TRANSLATED_PATHS, so localizePath() deliberately
 * leaves it on the English URL; the Turkish article tree carries its own prefix.
 */
function turkishArticlePath(slug: string): string {
  return `/tr/article/${slug}`;
}

/**
 * Every URL in an hreflang cluster must carry the full alternate set, so the
 * English and Turkish entries of a translated page emit identical links.
 * Untranslated paths have no Turkish counterpart and advertise nothing.
 */
function alternateLinks(path: string): string {
  if (!isTranslatedPath(path)) return '';
  return [
    `      <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${path}" />`,
    `      <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${localizePath(path, 'tr')}" />`,
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}" />`,
  ].map((link) => `\n${link}`).join('');
}

/**
 * A translated article pair carries both language alternates on both sides;
 * an article with no counterpart advertises nothing.
 */
function articleAlternates(slug: string, turkishSlug: string | undefined): string {
  if (!turkishSlug) return '';
  return [
    `      <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/article/${slug}" />`,
    `      <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${turkishArticlePath(turkishSlug)}" />`,
  ].map((link) => `\n${link}`).join('');
}

function legalAlternates(en: string, tr: string): string {
  return [
    `      <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${en}" />`,
    `      <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${tr}" />`,
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${en}" />`,
  ].map((link) => `\n${link}`).join('');
}

function legalUrl(path: string, alternates = ''): string {
  return `
    <url>
      <loc>${BASE_URL}${path}</loc>
      <priority>0.4</priority>
      <changefreq>yearly</changefreq>${alternates}
    </url>`;
}

export async function GET() {
  const articlesBySlug = new Map<string, string>();

  try {
    const articles = await listPublishedContentAsync();
    for (const article of articles) {
      if (article.slug && isIndexablePublishedArtifact(article)) articlesBySlug.set(article.slug, article.publishedAt);
    }
  } catch (err) {
    console.error('[Sitemap] Failed to load published content from files:', err);
  }

  // Pairs only through translationOf; originals are emitted on their own below.
  // listPublishedContentAsync('tr') falls back to an empty list when the
  // Turkish directory or database is unavailable.
  const turkishArticles = await listPublishedContentAsync('tr');
  const turkishIndex = indexTranslationsBySource(turkishArticles, isIndexablePublishedArtifact);
  const turkishOriginals = turkishArticles
    .filter(isIndexablePublishedArtifact)
    .filter((article) => !article.translationOf);

  const staticUrls = STATIC_PAGES.map(page => `
    <url>
      <loc>${BASE_URL}${page.url}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>${alternateLinks(page.url)}
    </url>`);

  const dynamicUrls = Array.from(articlesBySlug.entries()).map(([slug, publishedAt]) => `
    <url>
      <loc>${BASE_URL}/article/${slug}</loc>
      ${publishedAt ? `<lastmod>${new Date(publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>${articleAlternates(slug, turkishIndex.get(slug)?.slug)}
    </url>`);

  const turkishStaticUrls = STATIC_PAGES
    .filter(page => isTranslatedPath(page.url))
    .map(page => `
    <url>
      <loc>${BASE_URL}${localizePath(page.url, 'tr')}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>${alternateLinks(page.url)}
    </url>`);

  const turkishArticleUrls = Array.from(turkishIndex.entries())
    .filter(([sourceSlug]) => articlesBySlug.has(sourceSlug))
    .map(([sourceSlug, article]) => `
    <url>
      <loc>${BASE_URL}${turkishArticlePath(article.slug)}</loc>
      ${article.publishedAt ? `<lastmod>${new Date(article.publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>${articleAlternates(sourceSlug, article.slug)}
    </url>`);

  const turkishOriginalUrls = turkishOriginals.map((article) => `
    <url>
      <loc>${BASE_URL}${turkishArticlePath(article.slug)}</loc>
      ${article.publishedAt ? `<lastmod>${new Date(article.publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>
    </url>`);

  const legalUrls = LEGAL_PAGE_PAIRS.flatMap(({ en, tr }) => [
    legalUrl(en, legalAlternates(en, tr)),
    legalUrl(tr, legalAlternates(en, tr)),
  ]);
  const turkishOnlyLegalUrls = [legalUrl(LEGAL_PATHS.tr.kvkk)];
  const legalReady = isLegalControllerConfigured(getLegalController());

  const urls = [
    ...staticUrls,
    ...dynamicUrls,
    ...turkishStaticUrls,
    ...turkishArticleUrls,
    ...turkishOriginalUrls,
    ...(legalReady ? legalUrls : []),
    ...(legalReady ? turkishOnlyLegalUrls : []),
  ].join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
  );
}

import {
  isIndexablePublishedArtifact,
  listPublishedContentAsync,
} from '@/lib/content-automation/content-reader';

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
  { url: '/pilot-pulse', priority: '0.8', changefreq: 'daily' },
  { url: '/academy', priority: '0.8', changefreq: 'weekly' },
  { url: '/engineering', priority: '0.8', changefreq: 'weekly' },
  { url: '/tools', priority: '0.8', changefreq: 'weekly' },
  { url: '/buyers-guides', priority: '0.9', changefreq: 'weekly' },
  { url: '/comparisons', priority: '0.9', changefreq: 'weekly' },
  { url: '/reviews', priority: '0.9', changefreq: 'weekly' },
  { url: '/archive', priority: '0.7', changefreq: 'weekly' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/disclosure', priority: '0.6', changefreq: 'monthly' },
  { url: '/editorial-policy', priority: '0.6', changefreq: 'monthly' },
  { url: '/advertise', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { url: '/terms', priority: '0.4', changefreq: 'yearly' },
];

const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

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

  const staticUrls = STATIC_PAGES.map(page => `
    <url>
      <loc>${BASE_URL}${page.url}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>
    </url>`);

  const dynamicUrls = Array.from(articlesBySlug.entries()).map(([slug, publishedAt]) => `
    <url>
      <loc>${BASE_URL}/article/${slug}</loc>
      ${publishedAt ? `<lastmod>${new Date(publishedAt).toISOString()}</lastmod>` : ''}
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>
    </url>`);

  const urls = [...staticUrls, ...dynamicUrls].join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
  );
}

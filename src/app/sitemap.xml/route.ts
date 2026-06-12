import { listPublishedContent } from '@/lib/content-automation/content-reader';
import { loadContentJobsAsync } from '@/lib/server/content-jobs-store';
import { getStorageMode } from '@/lib/server/storage-mode';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/academy/roadmap', priority: '0.9', changefreq: 'weekly' },
  { url: '/academy/starter-kits', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/simulators', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/glossary', priority: '0.8', changefreq: 'weekly' },
  { url: '/engineering/hardware', priority: '0.9', changefreq: 'daily' },
  { url: '/engineering/firmware', priority: '0.9', changefreq: 'daily' },
  { url: '/engineering/workshop', priority: '0.8', changefreq: 'weekly' },
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
  { url: '/category/parts', priority: '0.8', changefreq: 'weekly' },
  { url: '/category/software', priority: '0.8', changefreq: 'weekly' },
];

const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

export async function GET() {
  const mode = getStorageMode();
  const slugsSet = new Set<string>();

  // 1. Load slugs from database if configured
  if (mode === 'postgres' || mode === 'dual') {
    try {
      const dbJobs = await loadContentJobsAsync();
      const publishedJobs = dbJobs.filter((job) => job.status === 'published');
      for (const job of publishedJobs) {
        const slug = job.seo?.slug || job.briefSlug;
        if (slug) slugsSet.add(slug);
      }
    } catch (err) {
      console.error('[Sitemap] Failed to load published content from DB:', err);
    }
  }

  // 2. Load slugs from filesystem as well (ensuring local files + committed guides are in sitemap)
  try {
    const fileArticles = listPublishedContent();
    for (const article of fileArticles) {
      if (article.slug) slugsSet.add(article.slug);
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

  const dynamicUrls = Array.from(slugsSet).map(slug => `
    <url>
      <loc>${BASE_URL}/article/${slug}</loc>
      <priority>0.8</priority>
      <changefreq>weekly</changefreq>
    </url>`);

  const urls = [...staticUrls, ...dynamicUrls].join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}

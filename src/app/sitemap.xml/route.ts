import fs from 'fs';
import path from 'path';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/academy/roadmap', priority: '0.9', changefreq: 'weekly' },
  { url: '/academy/starter-kits', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/simulators', priority: '0.8', changefreq: 'weekly' },
  { url: '/academy/glossary', priority: '0.8', changefreq: 'weekly' },
  { url: '/engineering/hardware', priority: '0.9', changefreq: 'daily' },
  { url: '/engineering/firmware', priority: '0.9', changefreq: 'daily' },
  { url: '/engineering/workshop', priority: '0.8', changefreq: 'weekly' },
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
  const urls = STATIC_PAGES.map(page => `
    <url>
      <loc>${BASE_URL}${page.url}</loc>
      <priority>${page.priority}</priority>
      <changefreq>${page.changefreq}</changefreq>
    </url>`).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}

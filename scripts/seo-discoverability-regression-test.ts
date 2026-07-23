import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateArticleSchema, generateSeoMetadata } from '../src/lib/seo/metadata';

const metadata = generateSeoMetadata({
  title: 'Test guide',
  description: 'Test description',
  path: '/article/test-guide',
});

assert.equal(metadata.openGraph?.locale, 'en_US');
assert.deepEqual(metadata.twitter?.images, ['https://fpvlovers.com.tr/api/content/media/cover/site-default']);
assert.equal(metadata.alternates?.canonical, 'https://fpvlovers.com.tr/article/test-guide');

const articleSchema = generateArticleSchema({
  title: 'Test guide',
  description: 'Test description',
  url: 'https://fpvlovers.com.tr/article/test-guide',
  datePublished: '2026-07-14T00:00:00.000Z',
  section: 'Engineering',
  wordCount: 800,
  citations: ['https://manufacturer.example/spec'],
});

assert.equal(articleSchema['@type'], 'Article');
assert.equal(articleSchema.articleSection, 'Engineering');
assert.equal(articleSchema.wordCount, 800);
assert.deepEqual(articleSchema.citation, ['https://manufacturer.example/spec']);
assert.equal(articleSchema.publisher.logo.url, 'https://fpvlovers.com.tr/logo-type.png');

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
const robots = read('src/app/robots.ts');
const sitemap = read('src/app/sitemap.xml/route.ts');
const articlePage = read('src/app/article/[slug]/page.tsx');

assert.match(robots, /disallow: \['\/admin', '\/admin\/', '\/api\/'\]/);
for (const hub of ['/buyers-guides', '/reviews', '/comparisons', '/disclosure', '/editorial-policy', '/advertise']) {
  assert.match(sitemap, new RegExp(`url: '${hub.replace('/', '\\/')}`));
}
assert.match(sitemap, /<lastmod>/);
assert.match(sitemap, /dynamic = 'force-dynamic'/);
assert.match(articlePage, /robots: \{ index: false, follow: true \}/);
assert.match(articlePage, /BreadcrumbList/);
assert.match(articlePage, /isApprovedHandsOnReview/);
assert.ok(fs.existsSync(path.join(process.cwd(), 'src/app/llms.txt/route.ts')));

console.log('SEO discoverability regression checks passed');

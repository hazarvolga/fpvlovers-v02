import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const baseUrl = (baseUrlArg?.split('=')[1] || process.env.SMOKE_BASE_URL || 'https://fpvlovers.com.tr').replace(/\/$/, '');
const publishedDir = path.join(process.cwd(), 'content', 'published');

function localPublishedSlugs() {
  const slugs = new Set();
  if (!fs.existsSync(publishedDir)) return slugs;

  for (const file of fs.readdirSync(publishedDir)) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(publishedDir, file);
    try {
      const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      slugs.add(typeof artifact.slug === 'string' ? artifact.slug : file.replace(/\.json$/, ''));
    } catch {
      slugs.add(file.replace(/\.json$/, ''));
    }
  }
  return slugs;
}

const response = await fetch(`${baseUrl}/sitemap.xml`, {
  headers: { 'user-agent': 'FPVLovers production-shadow-parity-audit' },
});

assert.equal(response.status, 200, `Expected sitemap HTTP 200, received ${response.status}`);

const sitemap = await response.text();
const liveSlugs = new Set(
  [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/article\/([^<]+)<\/loc>/g)]
    .map((match) => decodeURIComponent(match[1])),
);
const localSlugs = localPublishedSlugs();
const liveOnly = [...liveSlugs].filter((slug) => !localSlugs.has(slug)).sort();
const localOnly = [...localSlugs].filter((slug) => !liveSlugs.has(slug)).sort();

assert.equal(liveOnly.length, 0, `Live-only article artifacts must be exported before release: ${liveOnly.join(', ')}`);
assert.equal(localOnly.length, 0, `Local-only article artifacts are not visible in production sitemap: ${localOnly.join(', ')}`);

console.log(JSON.stringify({
  status: 'passed',
  baseUrl,
  localArticles: localSlugs.size,
  liveArticles: liveSlugs.size,
  liveOnly: liveOnly.length,
  localOnly: localOnly.length,
}, null, 2));

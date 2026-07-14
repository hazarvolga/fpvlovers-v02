import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const homepage = read('src/app/page.tsx');
const publishRoute = read('src/app/api/admin/content/publish/route.ts');
const searchSection = read('src/features/layout/components/SearchSection.tsx');
const globals = read('src/app/globals.css');
const buyersHub = read('src/app/buyers-guides/BuyersGuidesHubClient.tsx');
const comparisonsHub = read('src/app/comparisons/ComparisonsHubClient.tsx');
const reviewsHub = read('src/app/reviews/ReviewsHubClient.tsx');

assert.match(homepage, /export const revalidate\s*=\s*300/);
assert.match(homepage, /data-testid="latest-content-card"/);
assert.match(homepage, /recentPostCards\.map/);
assert.doesNotMatch(homepage, /recentPostCards\s*=\s*content\.recentPosts\.slice\(0,\s*3\)/);
assert.match(publishRoute, /revalidatePath\(['"]\/['"]\)/);

for (const forbiddenLabel of ['LINK ACTIVE', 'SYS.SCANNER: STANDBY']) {
  assert.doesNotMatch(searchSection, new RegExp(forbiddenLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

assert.doesNotMatch(globals, /\.fpv-public-panel\s*\{[^}]*backdrop-filter/);
assert.doesNotMatch(globals, /scanline-anim\s*\{[^}]*linear/);
assert.doesNotMatch(globals, /glitch-hover:hover\s*\{[^}]*linear/);
assert.match(buyersHub, /grid-cols-1 gap-6 lg:grid-cols-2/);
assert.match(comparisonsHub, /grid-cols-1 lg:grid-cols-2 gap-6/);
assert.match(reviewsHub, /Hands-on review.*Spec analysis/);

console.log('public editorial regression tests passed');

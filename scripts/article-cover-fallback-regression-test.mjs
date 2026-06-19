import fs from 'node:fs';

const pagePath = 'src/app/article/[slug]/page.tsx';
const componentPath = 'src/features/content/components/ResilientArticleCover.tsx';
const sharedComponentPath = 'src/components/ResilientCoverImage.tsx';
const violations = [];
const pageSource = fs.readFileSync(pagePath, 'utf8');

if (!fs.existsSync(componentPath)) {
  violations.push('missing ResilientArticleCover component');
} else {
  const componentSource = fs.readFileSync(componentPath, 'utf8');
  if (!componentSource.includes('<ResilientCoverImage')) violations.push('article cover does not use the shared resilient image chain');
  if (!componentSource.includes('fallbackSrc={fallbackSrc}')) violations.push('article cover does not receive the topic fallback source');
  if (!componentSource.includes('onFallbackChange={setUsesFallback}')) violations.push('article cover does not track runtime fallback state');
  if (!componentSource.includes('FPVLovers generated fallback')) violations.push('cover component has no fallback attribution');
}

if (!fs.existsSync(sharedComponentPath)) {
  violations.push('missing shared ResilientCoverImage component');
} else {
  const sharedComponentSource = fs.readFileSync(sharedComponentPath, 'utf8');
  if (!sharedComponentSource.includes('FALLBACK_COVER_PATHS.generic')) violations.push('shared cover chain has no generic final fallback');
  if (!sharedComponentSource.includes('onFallbackChange?.(true)')) violations.push('shared cover chain does not report fallback transitions');
}

if (!pageSource.includes('<ResilientArticleCover')) {
  violations.push('article page does not use ResilientArticleCover');
}
if (!pageSource.includes('resolveFallbackCover')) {
  violations.push('article page does not resolve topic-aware fallback covers');
}

if (violations.length > 0) {
  console.error(`Article cover fallback regression test failed with ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Article cover fallback regression test passed.');
}

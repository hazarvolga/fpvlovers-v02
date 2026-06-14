import fs from 'fs';
import path from 'path';

const ROOTS = ['src', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);
const STOCK_URL = /https?:\/\/[^\s"'`]*(?:picsum\.photos|(?:images\.)?unsplash\.com|(?:images\.)?pexels\.com)/gi;
const ALLOWED_FILES = new Set([
  path.normalize('src/lib/content-automation/crawl-image-license.ts'),
]);

function listSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) return listSourceFiles(filePath);
    return EXTENSIONS.has(path.extname(entry.name)) ? [filePath] : [];
  });
}

const violations: string[] = [];

for (const root of ROOTS) {
  for (const filePath of listSourceFiles(path.join(process.cwd(), root))) {
    const relativePath = path.relative(process.cwd(), filePath);
    if (ALLOWED_FILES.has(path.normalize(relativePath))) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const matches = source.match(STOCK_URL) || [];
    for (const match of matches) {
      violations.push(`${relativePath}: ${match}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Generic stock image URLs are forbidden outside the media-policy denylist:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log('Media policy audit passed: no Unsplash, Pexels, or Picsum runtime URLs found.');

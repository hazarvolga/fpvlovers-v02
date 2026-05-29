import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appDir = path.join(root, 'app');
const libDir = path.join(root, 'lib');
const srcAppDir = path.join(root, 'src', 'app');

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, absolute));
    }
  }

  return files.sort();
}

const errors = [];

if (!fs.existsSync(srcAppDir)) {
  errors.push('src/app directory is missing.');
}

if (fs.existsSync(appDir)) {
  errors.push('legacy app/ directory exists; single-tree migration expects src/app only.');
}

if (fs.existsSync(libDir)) {
  errors.push('legacy lib/ directory exists; shared code must live under src/lib.');
}

const srcFiles = walk(srcAppDir);
const routeFiles = srcFiles.filter((file) => /(^|\/)(page|layout|route|robots|sitemap)\.(ts|tsx)$/.test(file));

if (fs.existsSync(srcAppDir) && routeFiles.length === 0) {
  errors.push('src/app exists but no route files were found.');
}

if (errors.length > 0) {
  console.error('Single-tree route audit failed.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Single-tree route audit passed: ${routeFiles.length} route files under src/app.`);

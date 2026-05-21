import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appDir = path.join(root, 'app');
const srcAppDir = path.join(root, 'src', 'app');

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, absolute));
    }
  }

  return files.sort();
}

function readRelative(dir, relativePath) {
  return fs.readFileSync(path.join(dir, relativePath), 'utf-8');
}

const appFiles = walk(appDir);
const srcFiles = walk(srcAppDir);
const allFiles = [...new Set([...appFiles, ...srcFiles])].sort();
const missing = [];
const different = [];

for (const file of allFiles) {
  const inApp = appFiles.includes(file);
  const inSrc = srcFiles.includes(file);

  if (!inApp || !inSrc) {
    missing.push({ file, app: inApp, srcApp: inSrc });
    continue;
  }

  if (readRelative(appDir, file) !== readRelative(srcAppDir, file)) {
    different.push(file);
  }
}

if (missing.length > 0 || different.length > 0) {
  console.error('Route tree drift detected.');
  if (missing.length > 0) {
    console.error('\nMissing files:');
    for (const item of missing) {
      console.error(`- ${item.file} app=${item.app} srcApp=${item.srcApp}`);
    }
  }
  if (different.length > 0) {
    console.error('\nDifferent files:');
    for (const file of different) {
      console.error(`- ${file}`);
    }
  }
  process.exit(1);
}

console.log(`Route tree audit passed: ${allFiles.length} files synced.`);

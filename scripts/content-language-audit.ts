import fs from 'fs';
import path from 'path';
import {
  ensureMediaArtifact,
  hasLanguageMismatch,
  hasTurkishLanguageLeak,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';
import type { Locale } from '../src/lib/i18n/locale';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

type AuditTree = { locale: Locale; dir: string };

const TREES: AuditTree[] = [
  { locale: 'en', dir: PUBLISHED_DIR },
  { locale: 'tr', dir: path.join(PUBLISHED_DIR, 'tr') },
];

type Failure = { file: string; slug: string; reason: string };

function readArtifact(dir: string, file: string, locale: Locale): PublishedArtifact | null {
  try {
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    return ensureMediaArtifact(JSON.parse(raw), locale);
  } catch (error) {
    console.error(`[language-audit] cannot read ${file}:`, error);
    return null;
  }
}

let checked = 0;
const failures: Failure[] = [];

for (const tree of TREES) {
  if (!fs.existsSync(tree.dir)) continue;
  const files = fs.readdirSync(tree.dir).filter((file) => file.endsWith('.json')).sort();
  for (const file of files) {
    const artifact = readArtifact(tree.dir, file, tree.locale);
    if (!artifact) continue;
    checked += 1;

    if (tree.locale === 'en' && hasTurkishLanguageLeak(artifact)) {
      failures.push({ file, slug: artifact.slug, reason: 'Turkish text in the English tree' });
    }
    if (tree.locale === 'tr') {
      if (hasLanguageMismatch(artifact, 'tr')) {
        failures.push({ file, slug: artifact.slug, reason: 'English text in the Turkish tree' });
      }
      if (!artifact.translationOf && artifact.origin !== 'tr') {
        failures.push({ file, slug: artifact.slug, reason: 'Missing translationOf or origin:"tr"' });
      }
      if (artifact.locale !== 'tr') {
        failures.push({ file, slug: artifact.slug, reason: `Missing locale:"tr" marker (found ${artifact.locale || 'none'})` });
      }
    }
  }
}

if (failures.length === 0) {
  console.log(`✓ content language audit passed (${checked} artifacts checked)`);
  process.exit(0);
}

console.error(`✗ content language audit failed: ${failures.length} issue(s) across ${checked} artifacts`);
for (const failure of failures) {
  console.error(`  - ${failure.slug} (${failure.file}): ${failure.reason}`);
}

process.exit(1);

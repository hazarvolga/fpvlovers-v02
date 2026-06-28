import fs from 'fs';
import path from 'path';
import {
  ensureMediaArtifact,
  hasTurkishLanguageLeak,
  type PublishedArtifact,
} from '../src/lib/content-automation/content-reader';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function readArtifact(file: string): PublishedArtifact | null {
  try {
    const raw = fs.readFileSync(path.join(PUBLISHED_DIR, file), 'utf-8');
    const parsed = JSON.parse(raw);
    return ensureMediaArtifact(parsed);
  } catch (error) {
    console.error(`[language-audit] cannot read ${file}:`, error);
    return null;
  }
}

const files = fs.readdirSync(PUBLISHED_DIR)
  .filter((file) => file.endsWith('.json'))
  .sort();

const leakingArtifacts = files
  .map((file) => ({ file, artifact: readArtifact(file) }))
  .filter((entry): entry is { file: string; artifact: PublishedArtifact } => entry.artifact !== null)
  .filter(({ artifact }) => hasTurkishLanguageLeak(artifact));

if (leakingArtifacts.length === 0) {
  console.log(`✓ content language audit passed (${files.length} artifacts checked)`);
  process.exit(0);
}

console.error(`✗ content language audit failed: ${leakingArtifacts.length}/${files.length} artifacts contain Turkish-language leakage`);
for (const { file, artifact } of leakingArtifacts) {
  console.error(`  - ${artifact.slug} (${file})`);
}

process.exit(1);

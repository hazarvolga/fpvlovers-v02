import fs from 'node:fs';
import path from 'node:path';
import {
  contentTypes,
  validateContentMetadata,
  type ContentType,
} from '../src/lib/content-metadata';

interface PublishedJson {
  category?: unknown;
  metadata?: unknown;
}

const publishedDir = path.join(process.cwd(), 'content', 'published');
const files = fs.readdirSync(publishedDir).filter((file) => file.endsWith('.json'));
const allowedTypes = new Set<string>(contentTypes);
const violations: string[] = [];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function hasStringArray(value: unknown, allowEmpty = false): boolean {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every((item) => typeof item === 'string');
}

for (const file of files) {
  const artifact = JSON.parse(
    fs.readFileSync(path.join(publishedDir, file), 'utf8'),
  ) as PublishedJson;
  const metadata = asRecord(artifact.metadata);

  if (!metadata) {
    violations.push(`${file}: missing metadata`);
    continue;
  }

  const validation = validateContentMetadata(metadata);
  if (!validation.isValid) {
    violations.push(`${file}: ${validation.errors.join('; ')}`);
  }

  const contentType = metadata.contentType;
  if (typeof contentType !== 'string' || !allowedTypes.has(contentType)) {
    violations.push(`${file}: missing or invalid contentType`);
    continue;
  }

  if (typeof metadata.difficulty !== 'string') {
    violations.push(`${file}: missing difficulty`);
  }
  if (!hasStringArray(metadata.topics)) violations.push(`${file}: missing topics`);
  if (!hasStringArray(metadata.audience)) violations.push(`${file}: missing audience`);
  if (!hasStringArray(metadata.discipline)) violations.push(`${file}: missing discipline`);
  if (!hasStringArray(metadata.components, true)) violations.push(`${file}: missing components`);

  if (metadata.review !== undefined && contentType !== 'review') {
    violations.push(`${file}: review metadata requires review contentType`);
  }
  if (metadata.comparison !== undefined && contentType !== 'comparison') {
    violations.push(`${file}: comparison metadata requires comparison contentType`);
  }
  if (metadata.buyerGuide !== undefined
    && !(['buyer-guide', 'product-roundup'] satisfies ContentType[]).includes(contentType as ContentType)) {
    violations.push(`${file}: buyerGuide metadata requires buyer-guide or product-roundup contentType`);
  }

  if (artifact.category === 'Buyers Guides' || metadata.category === 'Buyers Guides') {
    violations.push(`${file}: non-canonical Buyers Guides category`);
  }
}

if (violations.length > 0) {
  console.error(`Content metadata regression test failed with ${violations.length} violation(s).`);
  for (const violation of violations.slice(0, 30)) console.error(`- ${violation}`);
  if (violations.length > 30) console.error(`- ... ${violations.length - 30} more`);
  process.exitCode = 1;
} else {
  console.log(`Content metadata regression test passed (${files.length} artifacts checked).`);
}

import fs from 'fs';
import path from 'path';
import type { GeneratedContent } from './parse-generated-content';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

export type PublishedArtifact = GeneratedContent & {
  slug: string;
  jobId: string;
  category: string;
  template: string;
  publishedAt: string;
  promptVersion: string;
  jobStatus: string;
};

export function listPublishedContent(): PublishedArtifact[] {
  try {
    const files = fs.readdirSync(PUBLISHED_DIR).filter((f) => f.endsWith('.json'));
    return files
      .map((file) => {
        try {
          const raw = fs.readFileSync(path.join(PUBLISHED_DIR, file), 'utf-8');
          const parsed = JSON.parse(raw);
          return parsed as PublishedArtifact;
        } catch {
          return null;
        }
      })
      .filter((a): a is PublishedArtifact => a !== null && typeof a.slug === 'string')
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  } catch {
    return [];
  }
}

export function getPublishedContentBySlug(slug: string): PublishedArtifact | null {
  const filePath = path.join(PUBLISHED_DIR, `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.slug === 'string') return parsed as PublishedArtifact;
    return null;
  } catch {
    return null;
  }
}

export function getPublishedSlugs(): string[] {
  return listPublishedContent().map((a) => a.slug);
}

import fs from 'fs';
import path from 'path';
import type { GeneratedContent } from './parse-generated-content';
import { buildContentMedia } from './content-media';
import type { ContentJob } from './types';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function publishGeneratedContentArtifact(
  slug: string,
  job: ContentJob,
  content: GeneratedContent,
): string {
  ensureDir(PUBLISHED_DIR);
  const jsonPath = path.join(PUBLISHED_DIR, `${slug}.json`);
  const mdPath = path.join(PUBLISHED_DIR, `${slug}.md`);
  const media = content.media || buildContentMedia({
    slug,
    title: content.title,
    category: job.category,
    excerpt: content.excerpt,
  });

  const artifact = {
    slug,
    title: content.title,
    jobId: job.id,
    category: job.category,
    template: job.template,
    seo: content.seo,
    excerpt: content.excerpt,
    bodySections: content.bodySections,
    internalLinks: content.internalLinks,
    publishNotes: content.publishNotes,
    media,
    jobStatus: job.status,
    publishedAt: new Date().toISOString(),
    promptVersion: job.promptVersion,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8');

  const markdown = [
    `# ${content.title}`,
    '',
    `> ${content.excerpt}`,
    '',
    ...content.bodySections.map(
      (section) => `## ${section.title}\n\n${section.content}\n`,
    ),
    ...(content.publishNotes.length > 0
      ? ['', '---', '', ...content.publishNotes.map((note) => `_${note}_`)]
      : []),
  ].join('\n');

  fs.writeFileSync(mdPath, markdown + '\n', 'utf-8');

  return `content/published/${slug}.json`;
}

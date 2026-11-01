import fs from 'node:fs';
import path from 'node:path';
import { attachTurkishSectionImages } from '../src/lib/content-automation/tr-section-media';
import { buildArtifactMarkdown } from '../src/lib/content-automation/publish-artifact';
import type { PublishedArtifact } from '../src/lib/content-automation/content-reader';

const DIR = path.join(process.cwd(), 'content', 'published', 'tr');

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const dryRun = process.argv.includes('--dry-run');
const onlySlug = arg('slug');

function relative(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join('/');
}

function main(): void {
  const files = fs.readdirSync(DIR).filter((file) => file.endsWith('.json')).sort();
  let inspected = 0;
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(DIR, file);
    const artifact = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PublishedArtifact;
    if (onlySlug && artifact.slug !== onlySlug) continue;
    if (!artifact.media) throw new Error(`${artifact.slug} has no media block`);
    inspected += 1;

    const illustration = attachTurkishSectionImages({
      slug: artifact.slug,
      title: artifact.title,
      bodySections: artifact.bodySections,
      gallery: artifact.media.gallery,
      imageSources: artifact.media.imageSources,
      attribution: artifact.media.attribution,
    });

    const figures = illustration.bodySections.filter((section) => Boolean(section.imageMatch?.src)).length;
    const added = illustration.bodySections.filter(
      (section, index) => !artifact.bodySections[index]?.imageMatch?.src && section.imageMatch?.src,
    ).length;

    if (added === 0) {
      console.log(`= ${artifact.slug}: unchanged (${figures} figures)`);
      continue;
    }

    if (dryRun) {
      console.log(`+ ${artifact.slug}: would add ${added} figures (total ${figures})`);
      continue;
    }

    const next: PublishedArtifact = {
      ...artifact,
      bodySections: illustration.bodySections,
      media: {
        ...artifact.media,
        gallery: illustration.gallery,
        imageSources: illustration.imageSources,
        attribution: illustration.attribution,
      },
    };

    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
    fs.writeFileSync(
      filePath.replace(/\.json$/, '.md'),
      buildArtifactMarkdown({
        title: next.title,
        excerpt: next.excerpt,
        bodySections: next.bodySections,
        publishNotes: next.publishNotes,
      }),
      'utf-8',
    );

    console.log(`✓ ${relative(filePath)}: +${added} figures (total ${figures})`);
    updated += 1;
  }

  console.log(
    dryRun
      ? `Dry run: ${inspected} artifact(s) inspected.`
      : `Backfill complete: ${updated} artifact(s) updated.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

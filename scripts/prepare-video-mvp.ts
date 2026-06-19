import fs from 'node:fs';
import path from 'node:path';
import { getPublishedContentBySlug } from '../src/lib/content-automation/content-reader';
import { createSocialJob } from '../src/lib/social/social-orchestrator';
import { validateVideoManifest, type VideoManifest } from '../src/lib/video/video-manifest';

const slug = 'dji-o3-vs-walksnail-avatar-comparison';
const article = getPublishedContentBySlug(slug);
if (!article) throw new Error(`MVP source article not found: ${slug}`);

const job = createSocialJob(article, ['facebook', 'instagram', 'youtube-shorts', 'tiktok', 'x', 'reddit', 'linkedin']);
const [titleFact, excerptFact, ...detailFacts] = job.factPack.facts;
if (!titleFact || !excerptFact) throw new Error('MVP source does not contain enough facts.');

const manifest: VideoManifest = {
  version: 1,
  sourceSlug: slug,
  contentClass: 'comparison',
  requiresHumanApproval: false,
  language: 'en',
  aspectRatio: '9:16',
  targetDurationSeconds: 45,
  facts: job.factPack.facts,
  scenes: [
    {
      id: 'hook',
      startSeconds: 0,
      endSeconds: 8,
      narration: 'DJI O3 versus Walksnail is not a one-spec decision. You are choosing a complete video ecosystem.',
      onScreenText: 'DJI O3 vs Walksnail',
      factIds: [titleFact.id],
      assetRefs: ['brand://split-signal'],
    },
    {
      id: 'priorities',
      startSeconds: 8,
      endSeconds: 22,
      narration: 'Start with the mission. Compare daytime image priorities, low-light needs, onboard recording, aircraft size, and weight.',
      onScreenText: 'Mission first: image / low light / recording / weight',
      factIds: [excerptFact.id, ...detailFacts.slice(0, 1).map((fact) => fact.id)],
      assetRefs: ['brand://decision-grid'],
    },
    {
      id: 'system',
      startSeconds: 22,
      endSeconds: 36,
      narration: 'Then check goggles, camera and transmitter formats, mounting space, and the upgrade path. Compatibility can matter more than a headline specification.',
      onScreenText: 'Check the whole system',
      factIds: detailFacts.slice(0, 2).map((fact) => fact.id),
      assetRefs: ['brand://ecosystem-map'],
    },
    {
      id: 'cta',
      startSeconds: 36,
      endSeconds: 45,
      narration: 'This is a specification-based comparison, not a hands-on test. Read the full context on FPVLovers.',
      onScreenText: 'Specification analysis. Full guide: FPVLovers',
      factIds: [titleFact.id],
      assetRefs: ['brand://end-card'],
    },
  ],
  cta: 'Read the full comparison on FPVLovers.',
  disclosures: ['Specification-based comparison; not presented as hands-on testing.'],
  containsSyntheticMedia: true,
  paidProductPlacement: false,
  uploadVisibility: 'private',
};

const validation = validateVideoManifest(manifest, job.factPack);
if (!validation.valid) throw new Error(validation.errors.join(' '));

const outputDirectory = path.join(process.cwd(), 'video', 'fpvlovers-short');
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, 'social-copy.json'), `${JSON.stringify(job.variants, null, 2)}\n`);
fs.writeFileSync(
  path.join(outputDirectory, 'narration.txt'),
  `${manifest.scenes.map((scene) => scene.narration).join('\n\n')}\n`,
);

console.log(`Prepared ${outputDirectory}`);

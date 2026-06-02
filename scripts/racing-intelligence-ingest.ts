import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { getQueueStatus } from '../src/lib/crawl-queue';
import { runRacingIntelligenceWorkflow } from '../src/lib/racing-intelligence';
import { getRacingStoreSummary, upsertRacingWorkflowResult } from '../src/lib/racing-intelligence-store';
import {
  applyQueueStatusToRacingSourcePack,
  readRacingSourcePack,
  type RacingSource,
} from '../src/lib/racing-source-pack';

type CrawlArtifact = {
  url: string;
  sourceName?: string;
  markdown: string;
  crawledAt?: string;
};

const ARTIFACT_DIR = path.join(process.cwd(), 'data', 'racing-crawl-artifacts');

function hashUrl(url: string) {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

function artifactPathForUrl(url: string) {
  return path.join(ARTIFACT_DIR, `${hashUrl(url)}.json`);
}

function readArtifact(source: RacingSource): CrawlArtifact | undefined {
  const artifactFile = artifactPathForUrl(source.url);
  if (!fs.existsSync(artifactFile)) return undefined;

  const raw = JSON.parse(fs.readFileSync(artifactFile, 'utf-8')) as unknown;
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Record<string, unknown>;
  const markdown = typeof record.markdown === 'string' ? record.markdown : '';
  if (markdown.trim().length < 80) return undefined;

  return {
    url: typeof record.url === 'string' ? record.url : source.url,
    sourceName: typeof record.sourceName === 'string' ? record.sourceName : source.name,
    markdown,
    crawledAt: typeof record.crawledAt === 'string' ? record.crawledAt : undefined,
  };
}

function modeForSource(source: RacingSource) {
  if (source.entityTargets.includes('calendar')) return 'calendar_update' as const;
  if (source.entityTargets.includes('results')) return 'result_analysis' as const;
  if (source.entityTargets.includes('pilot')) return 'pilot_profile' as const;
  return 'monitor_extract' as const;
}

async function main() {
  const statusOnly = process.argv.includes('--status');
  const pack = applyQueueStatusToRacingSourcePack(readRacingSourcePack(), getQueueStatus().jobs);
  const crawledSources = pack.sources.filter((source) => source.status === 'crawled');
  const artifactSources = crawledSources
    .map((source) => ({ source, artifact: readArtifact(source) }))
    .filter((item): item is { source: RacingSource; artifact: CrawlArtifact } => Boolean(item.artifact));

  console.log('\nFPVLovers Racing Intelligence Ingest\n');
  console.log(`Sources: total=${pack.sources.length}, crawled=${crawledSources.length}, artifacts=${artifactSources.length}`);
  console.log(`Artifact directory: ${ARTIFACT_DIR}`);
  console.log('Store summary:', JSON.stringify(getRacingStoreSummary(), null, 2));

  if (statusOnly) {
    if (crawledSources.length > artifactSources.length) {
      console.log(`Missing artifacts for ${crawledSources.length - artifactSources.length} crawled source(s).`);
    }
    return;
  }

  if (artifactSources.length === 0) {
    console.log('\nNo racing crawl artifacts ready. Store remains unchanged.');
    console.log('Expected artifact filename format: data/racing-crawl-artifacts/<sha1-url-16>.json');
    return;
  }

  let written = 0;
  for (const { source, artifact } of artifactSources) {
    console.log(`\n- ${source.name}: ${artifact.url}`);
    const result = await runRacingIntelligenceWorkflow({
      mode: modeForSource(source),
      sourceMarkdown: artifact.markdown,
      sourceUrl: artifact.url,
      sourceName: artifact.sourceName || source.name,
      leagueHint: source.name,
      publishIntent: 'review',
    });

    console.log(`  workflow=${result.status}, success=${result.success ? 'yes' : 'no'}, configured=${result.configured ? 'yes' : 'no'}`);
    const store = upsertRacingWorkflowResult(result);
    written += 1;
    console.log(`  store runs=${store.workflowRuns.length}, briefs=${store.contentBriefs.length}`);

    if (!result.configured) {
      console.log('  Dify Racing workflow is not configured yet; no entities were written.');
      break;
    }
  }

  console.log('\nFinal store summary:', JSON.stringify(getRacingStoreSummary(), null, 2));
  console.log(`Processed artifact(s): ${written}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown racing ingest failure';
  console.error(message);
  process.exit(1);
});

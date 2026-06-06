import './load-local-env';
import { getQueueStatus } from '../src/lib/crawl-queue';
import { readRacingCrawlArtifact, getRacingArtifactDir } from '../src/lib/racing-crawl-artifacts';
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

function readArtifact(source: RacingSource): CrawlArtifact | undefined {
  const artifact = readRacingCrawlArtifact(source.url);
  if (!artifact) return undefined;

  return {
    url: artifact.url,
    sourceName: artifact.sourceName || source.name,
    markdown: artifact.markdown,
    crawledAt: artifact.crawledAt,
  };
}

function modeForSource(source: RacingSource) {
  if (source.entityTargets.includes('calendar')) return 'calendar_update' as const;
  if (source.entityTargets.includes('results')) return 'result_analysis' as const;
  if (source.entityTargets.includes('pilot')) return 'pilot_profile' as const;
  return 'monitor_extract' as const;
}

function getLimitArg() {
  const explicit = process.argv.find((arg) => arg.startsWith('--limit='));
  if (!explicit) return undefined;

  const value = Number.parseInt(explicit.replace('--limit=', ''), 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function main() {
  const statusOnly = process.argv.includes('--status');
  const limit = getLimitArg();
  const pack = applyQueueStatusToRacingSourcePack(readRacingSourcePack(), getQueueStatus().jobs);
  const crawledSources = pack.sources.filter((source) => source.status === 'crawled');
  let artifactSources = crawledSources
    .map((source) => ({ source, artifact: readArtifact(source) }))
    .filter((item): item is { source: RacingSource; artifact: CrawlArtifact } => Boolean(item.artifact));

  if (limit) artifactSources = artifactSources.slice(0, limit);

  console.log('\nFPVLovers Racing Intelligence Ingest\n');
  console.log(`Sources: total=${pack.sources.length}, crawled=${crawledSources.length}, artifacts=${artifactSources.length}`);
  if (limit) console.log(`Run limit: ${limit}`);
  console.log(`Artifact directory: ${getRacingArtifactDir()}`);
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

    if (!result.configured) {
      console.log(`  workflow=${result.status}, success=no, configured=no`);
      console.log('  Dify Racing workflow is not configured yet; no entities were written.');
      break;
    }

    if (!result.success) {
      console.log(`  workflow=${result.status}, success=no, configured=yes`);
      console.log(`  Dify Racing workflow failed; store was not changed.${result.error ? ` Error: ${result.error}` : ''}`);
      continue;
    }

    console.log(`  workflow=${result.status}, success=yes, configured=yes`);
    const store = upsertRacingWorkflowResult(result);
    written += 1;
    console.log(`  store runs=${store.workflowRuns.length}, briefs=${store.contentBriefs.length}`);
  }

  console.log('\nFinal store summary:', JSON.stringify(getRacingStoreSummary(), null, 2));
  console.log(`Processed artifact(s): ${written}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown racing ingest failure';
  console.error(message);
  process.exit(1);
});

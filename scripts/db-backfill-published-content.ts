import { closePool } from '../src/lib/server/db';
import { listPublishedContent } from '../src/lib/content-automation/content-reader';
import { upsertPublishedArtifact } from '../src/lib/server/published-content-store';

async function main(): Promise<void> {
  const artifacts = listPublishedContent();
  let completed = 0;

  for (const artifact of artifacts) {
    await upsertPublishedArtifact(artifact);
    completed += 1;
  }

  console.log(`[Published Content Backfill] Upserted ${completed}/${artifacts.length} artifacts.`);
}

main()
  .catch((error: unknown) => {
    console.error('[Published Content Backfill] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

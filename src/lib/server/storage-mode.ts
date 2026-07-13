export type StorageMode = 'files' | 'dual' | 'postgres';

export function getStorageMode(): StorageMode {
  const mode = process.env.FPV_STORAGE_MODE;
  if (mode === 'postgres') return 'postgres';
  if (mode === 'dual') return 'dual';
  return 'files'; // Default fallback
}

export function getCrawlQueueStorageMode(): StorageMode {
  const mode = process.env.FPV_CRAWL_QUEUE_STORAGE_MODE;
  if (mode === 'postgres') return 'postgres';
  if (mode === 'dual') return 'dual';
  if (mode === 'files') return 'files';
  return getStorageMode();
}

export function getContentJobsStorageMode(): StorageMode {
  const mode = process.env.FPV_CONTENT_JOBS_STORAGE_MODE;
  if (mode === 'postgres') return 'postgres';
  if (mode === 'dual') return 'dual';
  if (mode === 'files') return 'files';
  return getStorageMode();
}

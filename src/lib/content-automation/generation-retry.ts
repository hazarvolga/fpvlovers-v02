export const MAX_TRANSIENT_ATTEMPTS = 4;
export const TRANSIENT_RETRY_DELAY_MS = 25 * 60 * 1000;
export const PUBLISH_COOLDOWN_HOURS = 18;

const TRANSIENT_ERROR_PATTERN =
  /\b503\b|UNAVAILABLE|high demand|overloaded|temporarily|timed? ?out|timeout|ECONNRESET|ETIMEDOUT|fetch failed|\b429\b|RESOURCE_EXHAUSTED|rate limit/i;

export type TransientRetryPlan =
  | { requeue: true; scheduledFor: string; attemptCount: number }
  | { requeue: false; attemptCount: number };

export function isTransientGenerationError(message: string): boolean {
  return TRANSIENT_ERROR_PATTERN.test(message);
}

/**
 * Google's free tier answers load spikes with 503/429. Those jobs are put back
 * in the queue for a later cron slot instead of being marked failed forever.
 */
export function planTransientRetry(
  message: string,
  previousAttempts: number,
  now: Date = new Date(),
): TransientRetryPlan {
  const attemptCount = previousAttempts + 1;
  if (!isTransientGenerationError(message) || attemptCount >= MAX_TRANSIENT_ATTEMPTS) {
    return { requeue: false, attemptCount };
  }
  return {
    requeue: true,
    attemptCount,
    scheduledFor: new Date(now.getTime() + TRANSIENT_RETRY_DELAY_MS).toISOString(),
  };
}

export type GenerationRunLike = { status: string; startedAt: string | Date };

export function hasPublishedWithin(
  runs: readonly GenerationRunLike[],
  hours: number,
  now: Date = new Date(),
): boolean {
  const cutoff = now.getTime() - hours * 60 * 60 * 1000;
  return runs.some((run) => run.status === 'published' && new Date(run.startedAt).getTime() >= cutoff);
}

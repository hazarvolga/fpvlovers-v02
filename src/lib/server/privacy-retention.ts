// Retention enforcement for the windows promised in src/lib/legal/documents.ts:
//   - analytics events: at most 180 days
//   - unconfirmed newsletter subscriptions: 30 days
//   - consent records: at most 5 years (proof of consent)
// The module stays pure: it receives a query function so it can be exercised
// without a live database.

export type RetentionQuery = (sql: string, params?: unknown[]) => Promise<{ rowCount: number | null }>;

export interface RetentionOptions {
  now?: Date;
  analyticsDays?: number;
  pendingSubscriberDays?: number;
  consentYears?: number;
}

export interface RetentionResult {
  analyticsEvents: number;
  pendingSubscribers: number;
  consentRecords: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function cutoff(now: Date, ms: number): Date {
  return new Date(now.getTime() - ms);
}

export async function purgeExpiredPrivacyData(
  runQuery: RetentionQuery,
  options: RetentionOptions = {},
): Promise<RetentionResult> {
  const now = options.now ?? new Date();
  const analyticsDays = options.analyticsDays ?? 180;
  const pendingSubscriberDays = options.pendingSubscriberDays ?? 30;
  const consentYears = options.consentYears ?? 5;

  if (analyticsDays <= 0 || pendingSubscriberDays <= 0 || consentYears <= 0) {
    throw new Error('Retention windows must be positive');
  }

  const analytics = await runQuery(
    'DELETE FROM fpvlovers_analytics.events WHERE occurred_at < $1',
    [cutoff(now, analyticsDays * DAY_MS)],
  );
  // Only unconfirmed rows expire; active and unsubscribed subscribers are never touched.
  const pending = await runQuery(
    "DELETE FROM fpvlovers_app.newsletter_subscribers WHERE status = 'pending' AND subscribed_at < $1",
    [cutoff(now, pendingSubscriberDays * DAY_MS)],
  );
  const consentCutoff = new Date(now);
  consentCutoff.setUTCFullYear(consentCutoff.getUTCFullYear() - consentYears);
  const consent = await runQuery(
    'DELETE FROM fpvlovers_app.consent_records WHERE created_at < $1',
    [consentCutoff],
  );

  return {
    analyticsEvents: analytics.rowCount ?? 0,
    pendingSubscribers: pending.rowCount ?? 0,
    consentRecords: consent.rowCount ?? 0,
  };
}

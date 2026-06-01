import { query } from './db';
import { getStorageMode } from './storage-mode';

export interface AnalyticsEventInput {
  eventType: string; // 'content_publish', 'crawl_complete', 'crawl_failed', 'affiliate_click', 'campaign_view', etc.
  anonymousId?: string;
  sessionId?: string;
  contentSlug?: string;
  productId?: string; // UUID
  affiliateOfferId?: string; // UUID
  sponsorId?: string; // UUID
  campaignId?: string; // UUID
  source?: string; // 'frontend', 'crawler', 'admin', 'cron'
  metadata?: any;
}

export interface DailyRollupInput {
  rollupDate: Date | string;
  metricKey: string;
  dimensionKey?: string;
  dimensionValue?: string;
  value: number;
  metadata?: any;
}

export interface TrustScoreInput {
  entityType: string; // 'sponsor', 'affiliate', 'product'
  entityId: string;
  score: number;
  reason?: any;
}

export async function logAnalyticsEvent(event: AnalyticsEventInput): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return; // Silent noop in files mode

  try {
    await query(`
      INSERT INTO fpvlovers_analytics.events (
        event_type, anonymous_id, session_id, content_slug, 
        product_id, affiliate_offer_id, sponsor_id, campaign_id, 
        source, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      event.eventType,
      event.anonymousId || null,
      event.sessionId || null,
      event.contentSlug || null,
      event.productId || null,
      event.affiliateOfferId || null,
      event.sponsorId || null,
      event.campaignId || null,
      event.source || 'server',
      event.metadata || {}
    ]);
  } catch (err) {
    console.error('[DB Analytics] Failed to log analytics event:', err);
  }
}

export async function upsertDailyRollup(rollup: DailyRollupInput): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return;

  try {
    const rDate = typeof rollup.rollupDate === 'string' ? rollup.rollupDate : rollup.rollupDate.toISOString().split('T')[0];
    await query(`
      INSERT INTO fpvlovers_analytics.daily_rollups (
        rollup_date, metric_key, dimension_key, dimension_value, value, metadata, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (rollup_date, metric_key, dimension_key, dimension_value) DO UPDATE SET
        value = EXCLUDED.value,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `, [
      rDate,
      rollup.metricKey,
      rollup.dimensionKey || 'global',
      rollup.dimensionValue || 'global',
      rollup.value,
      rollup.metadata || {}
    ]);
  } catch (err) {
    console.error('[DB Analytics] Failed to upsert daily rollup:', err);
  }
}

export async function upsertTrustScore(score: TrustScoreInput): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return;

  try {
    await query(`
      INSERT INTO fpvlovers_analytics.trust_scores (
        entity_type, entity_id, score, reason, calculated_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        score = EXCLUDED.score,
        reason = EXCLUDED.reason,
        calculated_at = NOW()
    `, [
      score.entityType,
      score.entityId,
      score.score,
      score.reason || {}
    ]);
  } catch (err) {
    console.error('[DB Analytics] Failed to upsert trust score:', err);
  }
}

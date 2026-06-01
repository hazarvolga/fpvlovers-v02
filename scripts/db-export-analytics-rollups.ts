import { query, getPool } from '../src/lib/server/db';
import * as fs from 'fs';
import * as path from 'path';

const METRICS_FILE = path.join(process.cwd(), 'data', 'campaignMetrics.json');
const TRUST_SCORES_FILE = path.join(process.cwd(), 'data', 'trustScores.json');

async function dbExportAnalyticsRollups() {
  console.log('[Export Analytics] Querying analytics and trust scores from PostgreSQL...');

  try {
    await query('SELECT 1');
  } catch (err: any) {
    console.warn('\n[Export Analytics] PostgreSQL database is offline. Skipping export gracefully.');
    console.log(`Database health detail: ${err.message}`);
    return;
  }

  try {
    // 1. Reconstruct campaignMetrics.json
    console.log('[Export Analytics] Exporting campaign metrics...');
    
    const rollupRes = await query(`
      SELECT metric_key, SUM(value) as total_val
      FROM fpvlovers_analytics.daily_rollups
      GROUP BY metric_key
    `);

    const metricsMap: Record<string, number> = {};
    for (const row of rollupRes.rows) {
      metricsMap[row.metric_key] = parseFloat(row.total_val) || 0;
    }

    const totalClicks = metricsMap['affiliate_clicks'] || 0;
    const totalConversions = metricsMap['affiliate_conversions'] || 0;
    const totalRevenue = metricsMap['affiliate_revenue'] || 0;
    const avgCtr = totalClicks > 0 ? (totalConversions / totalClicks) * 0.1 : 0.0;
    const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0.0;

    const sponsorImpressions = metricsMap['sponsor_impressions'] || 0;
    const sponsorClicks = metricsMap['sponsor_clicks'] || 0;
    const sponsorCtr = sponsorImpressions > 0 ? sponsorClicks / sponsorImpressions : 0.0;
    const sponsorRetrievals = metricsMap['sponsor_retrieval_appearances'] || 0;

    const dailySeriesRes = await query(`
      SELECT rollup_date, metric_key, SUM(value) as val
      FROM fpvlovers_analytics.daily_rollups
      GROUP BY rollup_date, metric_key
      ORDER BY rollup_date ASC
    `);

    const affiliateDailyMap: Record<string, any> = {};
    const sponsorDailyMap: Record<string, any> = {};

    for (const row of dailySeriesRes.rows) {
      const dStr = new Date(row.rollup_date).toISOString().split('T')[0];
      const val = parseFloat(row.val) || 0;

      if (row.metric_key.startsWith('affiliate_')) {
        if (!affiliateDailyMap[dStr]) affiliateDailyMap[dStr] = { date: dStr, clicks: 0, conversions: 0, revenue: 0 };
        if (row.metric_key === 'affiliate_clicks') affiliateDailyMap[dStr].clicks = val;
        if (row.metric_key === 'affiliate_conversions') affiliateDailyMap[dStr].conversions = val;
        if (row.metric_key === 'affiliate_revenue') affiliateDailyMap[dStr].revenue = val;
      } else if (row.metric_key.startsWith('sponsor_')) {
        if (!sponsorDailyMap[dStr]) sponsorDailyMap[dStr] = { date: dStr, impressions: 0, clicks: 0, retrievalAppearances: 0 };
        if (row.metric_key === 'sponsor_impressions') sponsorDailyMap[dStr].impressions = val;
        if (row.metric_key === 'sponsor_clicks') sponsorDailyMap[dStr].clicks = val;
        if (row.metric_key === 'sponsor_retrieval_appearances') sponsorDailyMap[dStr].retrievalAppearances = val;
      }
    }

    const campaignMetrics = {
      affiliate: {
        totalClicks,
        totalConversions,
        totalRevenue,
        averageCtr: avgCtr,
        averageConversionRate: avgConversionRate,
        byNetwork: {
          amazon: { clicks: Math.round(totalClicks * 0.4), conversions: Math.round(totalConversions * 0.4), revenue: totalRevenue * 0.4 },
          banggood: { clicks: Math.round(totalClicks * 0.3), conversions: Math.round(totalConversions * 0.3), revenue: totalRevenue * 0.3 },
          getfpv: { clicks: Math.round(totalClicks * 0.3), conversions: Math.round(totalConversions * 0.3), revenue: totalRevenue * 0.3 }
        },
        byCategory: {},
        byPlacement: {
          "top-right": { impressions: 0, clicks: 0, ctr: 0 },
          "bottom-right": { impressions: 0, clicks: 0, ctr: 0 },
          inline: { impressions: 0, clicks: 0, ctr: 0 },
          sticky: { impressions: 0, clicks: 0, ctr: 0 }
        },
        daily: Object.values(affiliateDailyMap)
      },
      sponsor: {
        totalImpressions: sponsorImpressions,
        totalClicks: sponsorClicks,
        averageCtr: sponsorCtr,
        totalRetrievalAppearances: sponsorRetrievals,
        averageSemanticMatchQuality: 0.88,
        bySponsor: {},
        daily: Object.values(sponsorDailyMap)
      },
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(METRICS_FILE, JSON.stringify(campaignMetrics, null, 2) + '\n', 'utf-8');
    console.log(`[Export Analytics] Successfully exported campaign metrics to ${METRICS_FILE}`);

    // 2. Reconstruct trustScores.json
    console.log('[Export Analytics] Exporting trust scores...');
    const trustRes = await query(`
      SELECT entity_type, entity_id, score, reason, calculated_at
      FROM fpvlovers_analytics.trust_scores
      ORDER BY entity_id ASC
    `);

    const affiliates: Record<string, any> = {};
    const sponsors: Record<string, any> = {};

    for (const row of trustRes.rows) {
      const reasonObj = row.reason || {};
      const scoreData = {
        trustScore: parseFloat(row.score),
        semanticRelevance: reasonObj.semanticRelevance || 90,
        recommendationQuality: reasonObj.recommendationQuality || 90,
        bounceImpact: reasonObj.bounceImpact !== undefined ? parseFloat(reasonObj.bounceImpact) : 0,
        retrievalQuality: reasonObj.retrievalQuality || 90,
        userFeedback: reasonObj.userFeedback || { positive: 0, negative: 0, neutral: 0 },
        updatedAt: row.calculated_at ? new Date(row.calculated_at).toISOString() : new Date().toISOString()
      };

      if (row.entity_type === 'affiliate') {
        affiliates[row.entity_id] = scoreData;
      } else if (row.entity_type === 'sponsor') {
        sponsors[row.entity_id] = scoreData;
      }
    }

    const trustScores = {
      affiliates,
      sponsors,
      globalConfig: {
        minTrustScoreAffiliate: 60,
        minTrustScoreSponsor: 50,
        maxPlacementsPerPage: 3,
        trustWeightInRanking: 0.4,
        semanticRelevanceWeight: 0.3,
        retrievalConfidenceWeight: 0.2,
        sponsorWeight: 0.1
      },
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(TRUST_SCORES_FILE, JSON.stringify(trustScores, null, 2) + '\n', 'utf-8');
    console.log(`[Export Analytics] Successfully exported trust scores to ${TRUST_SCORES_FILE}`);

  } catch (err) {
    console.error('[Export Analytics] Export failed:', err);
  } finally {
    try {
      const pool = getPool();
      await pool.end();
      console.log('[Export Analytics] Database connection pool closed.');
    } catch (endError) {
      console.error('[Export Analytics] Error closing connection pool:', endError);
    }
  }
}

dbExportAnalyticsRollups();

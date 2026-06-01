import { query, getPool } from '../src/lib/server/db';
import * as fs from 'fs';
import * as path from 'path';

const CATALOG_FILE = path.join(process.cwd(), 'data', 'fpv-products.catalog.json');
const AFFILIATES_FILE = path.join(process.cwd(), 'data', 'affiliates.json');
const SPONSORS_FILE = path.join(process.cwd(), 'data', 'sponsors.json');
const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

async function dbExportCommerce() {
  console.log('[Export Commerce] Starting commerce export from PostgreSQL...');

  try {
    await query('SELECT 1');
  } catch (err: any) {
    console.warn('\n[Export Commerce] PostgreSQL database is offline. Skipping export gracefully.');
    console.log(`Database health detail: ${err.message}`);
    return;
  }

  try {
    // 1. Export Product Catalog (Physical hardware components)
    console.log('[Export Commerce] Exporting product catalog...');
    const prodRes = await query(`
      SELECT slug, name, brand, category, specs
      FROM fpvlovers_commerce.products
      WHERE slug NOT LIKE 'aff_%'
      ORDER BY created_at ASC
    `);

    const components = prodRes.rows.map(row => {
      const specsObj = row.specs || {};
      const weightGrams = specsObj.weightGrams !== undefined ? specsObj.weightGrams : null;
      const affiliateUrl = specsObj.affiliateUrl || '';

      const specs = { ...specsObj };
      delete specs.weightGrams;
      delete specs.affiliateUrl;

      return {
        id: row.slug,
        brand: row.brand || '',
        name: row.name,
        category: row.category,
        weightGrams,
        specs,
        affiliateUrl
      };
    });

    const catalogData = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'FPV Component Catalog',
      description: 'Static database specifications of physical hardware components.',
      components
    };
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalogData, null, 2) + '\n', 'utf-8');
    console.log(`[Export Commerce] Successfully exported ${components.length} components to ${CATALOG_FILE}`);

    // 2. Export Affiliates
    console.log('[Export Commerce] Exporting affiliates...');
    const affRes = await query(`
      SELECT 
        o.network, o.merchant, o.tracking_url, o.commission_rate, o.currency, o.status as offer_status, o.metadata as offer_metadata,
        p.slug, p.name, p.category, p.brand, p.specs as prod_specs, p.created_at, p.updated_at
      FROM fpvlovers_commerce.affiliate_offers o
      JOIN fpvlovers_commerce.products p ON o.product_id = p.id
      ORDER BY o.created_at ASC
    `);

    const affiliatesList = [];
    for (const row of affRes.rows) {
      const prodSpecs = row.prod_specs || {};
      const offerMeta = row.offer_metadata || {};
      const slug = row.slug;

      // Get latest observed price
      const priceRes = await query(`
        SELECT price 
        FROM fpvlovers_commerce.product_prices 
        WHERE product_id = (SELECT id FROM fpvlovers_commerce.products WHERE slug = $1)
        ORDER BY observed_at DESC 
        LIMIT 1
      `, [slug]);

      const price = priceRes.rowCount && priceRes.rowCount > 0 ? parseFloat(priceRes.rows[0].price) : undefined;

      const affItem = {
        id: slug,
        name: row.name,
        type: prodSpecs.type || slug.replace('aff_', '').split('_')[0] || 'other',
        network: row.network,
        productId: offerMeta.productIdField || '',
        url: row.tracking_url,
        price,
        currency: row.currency,
        commission: parseFloat(row.commission_rate),
        category: row.category,
        keywords: offerMeta.keywords || prodSpecs.keywords || [],
        trustScore: offerMeta.trustScore || prodSpecs.trustScore || 90,
        image: offerMeta.image || prodSpecs.image || '',
        compatibleWith: offerMeta.compatibleWith || prodSpecs.compatibleWith || [],
        active: row.offer_status === 'active',
        featured: offerMeta.featured || prodSpecs.featured || false,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        stats: offerMeta.stats || {
          clicks: 0,
          conversions: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0
        }
      };
      affiliatesList.push(affItem);
    }
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(affiliatesList, null, 2) + '\n', 'utf-8');
    console.log(`[Export Commerce] Successfully exported ${affiliatesList.length} affiliates to ${AFFILIATES_FILE}`);

    // 3. Export Sponsors
    console.log('[Export Commerce] Exporting sponsors...');
    const sponRes = await query(`
      SELECT name, slug, website_url, tier, status, fit_score, metadata, created_at, updated_at
      FROM fpvlovers_commerce.sponsors
      ORDER BY created_at ASC
    `);

    const sponsorsList = sponRes.rows.map(row => {
      const meta = row.metadata || {};
      return {
        id: row.slug,
        name: row.name,
        type: meta.type || 'manufacturer',
        brand: row.name,
        tier: row.tier,
        url: row.website_url,
        budget: meta.budget || 'monthly',
        budgetAmount: meta.budgetAmount || 0.0,
        priority: meta.priority || 100,
        category: meta.category || 'Other',
        region: meta.region || 'global',
        active: row.status === 'active',
        products: meta.products || [],
        visibilityScore: meta.visibilityScore || 80,
        semanticRelevance: row.fit_score ? parseFloat(row.fit_score) : 90,
        retrievalPresence: meta.retrievalPresence || 0,
        recommendationExposure: meta.recommendationExposure || 0,
        campaignHistory: meta.campaignHistory || [],
        trustScore: meta.trustScore || 100,
        campaignMetrics: meta.campaignMetrics || {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          contextualEngagement: 0,
          retrievalAppearances: 0,
          recommendationConfidence: 0,
          semanticMatchQuality: 0
        },
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
    });
    fs.writeFileSync(SPONSORS_FILE, JSON.stringify(sponsorsList, null, 2) + '\n', 'utf-8');
    console.log(`[Export Commerce] Successfully exported ${sponsorsList.length} sponsors to ${SPONSORS_FILE}`);

    // 4. Export Campaigns
    console.log('[Export Commerce] Exporting campaigns...');
    const campRes = await query(`
      SELECT id, name, kind, status, starts_at, ends_at, goals, created_at, updated_at
      FROM fpvlovers_commerce.campaigns
      ORDER BY created_at ASC
    `);

    const campaignsList = [];
    for (const row of campRes.rows) {
      const campaignId = row.id;

      const varRes = await query(`
        SELECT name, cta_text, target_url, weight, metadata
        FROM fpvlovers_commerce.campaign_variants
        WHERE campaign_id = $1
        ORDER BY name ASC
      `, [campaignId]);

      const variants = varRes.rows.map(vRow => {
        const vMeta = vRow.metadata || {};
        return {
          name: vRow.name,
          cta: vRow.cta_text,
          url: vRow.target_url,
          traffic: vRow.weight,
          color: vMeta.color || 'primary',
          placement: vMeta.placement || 'sidebar'
        };
      });

      campaignsList.push({
        id: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: row.name,
        type: row.kind,
        status: row.status,
        startDate: row.starts_at ? new Date(row.starts_at).toISOString().split('T')[0] : null,
        endDate: row.ends_at ? new Date(row.ends_at).toISOString().split('T')[0] : null,
        metrics: row.goals,
        variants,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      });
    }
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaignsList, null, 2) + '\n', 'utf-8');
    console.log(`[Export Commerce] Successfully exported ${campaignsList.length} campaigns to ${CAMPAIGNS_FILE}`);

  } catch (err) {
    console.error('[Export Commerce] Export failed:', err);
  } finally {
    try {
      const pool = getPool();
      await pool.end();
      console.log('[Export Commerce] Database connection pool closed.');
    } catch (endError) {
      console.error('[Export Commerce] Error closing connection pool:', endError);
    }
  }
}

dbExportCommerce();

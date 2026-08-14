// LLM Response Cache — PostgreSQL based, SHA256 hashing
// Reduces duplicate API calls for identical prompts

import { createHash } from 'crypto';
import { getRequiredEnv } from '@/lib/env';

const CACHE_ENABLED = process.env.LLM_CACHE_ENABLED !== 'false';

// ─── HASHING ───

export type LlmCacheIdentity = {
  model: string;
  endpoint: string;
  method: string;
  baseUrl: string;
  appIdentity: string;
  knowledgeRevision?: string;
  body: unknown;
};

export function hashInput(identity: LlmCacheIdentity): string {
  const input = JSON.stringify(identity);
  return createHash('sha256').update(input).digest('hex').slice(0, 64);
}

// ─── CACHE CLIENT ───

// PostgreSQL client — uses Dify DB via lib/dify-client.ts context
// Falls back to in-memory cache if PostgreSQL is unavailable

const memoryCache = new Map<string, { response: any; model: string; taskType: string; createdAt: number; hits: number }>();

async function getPgClient(): Promise<any | null> {
  try {
    // Use Dify's existing PostgreSQL connection pattern
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: getRequiredEnv('DB_HOST'),
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: getRequiredEnv('DB_USERNAME'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_DATABASE'),
      connectionTimeoutMillis: 3000,
    });
    return pool;
  } catch {
    return null;
  }
}

// ─── PUBLIC API ───

export async function getCached(hash: string): Promise<any | null> {
  if (!CACHE_ENABLED) return null;

  // Check memory cache first
  const memEntry = memoryCache.get(hash);
  if (memEntry) {
    memEntry.hits++;
    return memEntry.response;
  }

  // Check PostgreSQL cache
  try {
    const pg = await getPgClient();
    if (!pg) return null;

    const result = await pg.query(
      `SELECT response, hits FROM content_engine.llm_cache
       WHERE input_hash = $1 AND (expires_at IS NULL OR expires_at > now())`,
      [hash]
    );

    if (result.rows.length > 0) {
      // Increment hit counter
      await pg.query(
        'UPDATE content_engine.llm_cache SET hits = hits + 1 WHERE input_hash = $1',
        [hash]
      );
      await pg.end();
      return result.rows[0].response;
    }
    await pg.end();
  } catch {
    // PostgreSQL unavailable — fall through to null
  }

  return null;
}

export async function setCached(
  hash: string,
  response: any,
  model: string,
  taskType: string,
  ttlDays: number = 7,
): Promise<void> {
  if (!CACHE_ENABLED) return;

  // Always store in memory cache
  memoryCache.set(hash, {
    response,
    model,
    taskType,
    createdAt: Date.now(),
    hits: 0,
  });

  // Store in PostgreSQL
  try {
    const pg = await getPgClient();
    if (!pg) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await pg.query(
      `INSERT INTO content_engine.llm_cache (input_hash, response, model, task_type, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (input_hash) DO UPDATE SET response = $2, model = $3, task_type = $4, expires_at = $5`,
      [hash, JSON.stringify(response), model, taskType, expiresAt.toISOString()]
    );
    await pg.end();
  } catch {
    // PostgreSQL unavailable — memory cache is sufficient
  }
}

export async function getCacheStats(): Promise<{ total: number; hits: number; hit_rate: number }> {
  let total = 0;
  let totalHits = 0;

  // Memory cache stats
  for (const entry of memoryCache.values()) {
    total++;
    totalHits += entry.hits;
  }

  // PostgreSQL stats
  try {
    const pg = await getPgClient();
    if (pg) {
      const result = await pg.query(
        'SELECT count(*) as total, coalesce(sum(hits), 0) as hits FROM content_engine.llm_cache'
      );
      if (result.rows.length > 0) {
        total += parseInt(result.rows[0].total) || 0;
        totalHits += parseInt(result.rows[0].hits) || 0;
      }
      await pg.end();
    }
  } catch {}

  return {
    total,
    hits: totalHits,
    hit_rate: total > 0 ? Math.round((totalHits / (total + totalHits)) * 100) / 100 : 0,
  };
}

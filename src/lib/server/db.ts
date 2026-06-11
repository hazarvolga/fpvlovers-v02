import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// ─── Programmatic .env.local loader ──────────────────────────────────
// For script execution contexts where Next.js environment is not initialized

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to programmatically parse .env.local file', err);
    }
  }
}

// ─── Configuration ───────────────────────────────────────────────────

function getPoolConfig(): NonNullable<ConstructorParameters<typeof Pool>[0]> {
  loadEnvLocal();

  const connectionString = process.env.FPV_DATABASE_URL;
  const poolMax = parseInt(process.env.FPV_DB_POOL_MAX || '3', 10);
  const maxPool = Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 3;

  const enableSsl =
    (connectionString && connectionString.includes('sslmode=require')) ||
    process.env.FPV_DB_SSL === 'true';

  const sslConfig = enableSsl ? { ssl: { rejectUnauthorized: false } } : {};

  if (connectionString) {
    return {
      connectionString,
      max: maxPool,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 10_000,
      ...sslConfig,
    };
  }

  // Fallback to legacy individual env vars
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE;

  if (!host || !database) {
    console.warn('[fpv-db] Neither FPV_DATABASE_URL nor DB_HOST/DB_DATABASE set. Pool initialization may fail.');
  }

  return {
    host,
    port,
    user,
    password,
    database,
    max: maxPool,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
    ...sslConfig,
  };
}

// ─── Lazy Singleton Pool ─────────────────────────────────────────────

export interface DbPool {
  query: (text: string, params?: unknown[]) => Promise<any>;
  connect: () => Promise<any>;
  end: () => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => this;
}

let _pool: DbPool | null = null;

/** Return the shared pool, creating it on first call. */
export function getPool(): DbPool {
  if (!_pool) {
    const config = getPoolConfig();
    _pool = new Pool(config) as unknown as DbPool;

    // Surface unexpected pool errors instead of crashing silently.
    (_pool as unknown as EventEmitter).on('error', (err: Error) => {
      console.error('[fpv-db] Unexpected pool error:', err.message);
    });

    const connInfo = config.connectionString
      ? 'connection string'
      : `${config.host}:${config.port}/${config.database}`;
    console.log(`[fpv-db] Initializing PostgreSQL pool using ${connInfo} (max: ${config.max})`);
  }
  return _pool!;
}

// ─── Query Helper ────────────────────────────────────────────────────

export interface QueryResultRow {
  [column: string]: any;
}

export interface QueryResult<T extends QueryResultRow> {
  rows: T[];
  command: string;
  rowCount: number | null;
  oid: number;
  fields: any[];
}

/**
 * Execute a parameterised SQL query and return typed rows.
 *
 * @example
 * const { rows } = await query<ContentJobRow>(
 *   'SELECT * FROM fpvlovers_app.content_jobs WHERE status = $1',
 *   ['queued'],
 * );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query(text, params) as unknown as Promise<QueryResult<T>>;
}

// ─── Client Helper ───────────────────────────────────────────────────

export interface PoolClient {
  query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
  release: (err?: Error | boolean) => void;
}

/** Acquire a client from the pool for transaction work. Remember to release(). */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  const client = await pool.connect();
  return client as unknown as PoolClient;
}

// ─── Health Check ────────────────────────────────────────────────────

export interface DbHealthResult {
  ok: boolean;
  latencyMs: number;
  serverVersion?: string;
  error?: string;
}

export async function healthCheck(): Promise<DbHealthResult> {
  const start = performance.now();
  try {
    const pool = getPool();
    const res = await pool.query(
      'SELECT version() AS version',
    ) as unknown as QueryResult<{ version: string }>;
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: true,
      latencyMs,
      serverVersion: res.rows[0]?.version,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────────────

/** Drain and close the pool. Safe to call multiple times. */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

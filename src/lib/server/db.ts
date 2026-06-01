// Resilient DB Client with local type definitions and automatic .env.local loader
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// Declare minimal interface types to mock pg types safely in TypeScript compiler
export interface QueryResultRow {
  [column: string]: any;
}

export interface QueryResult<T extends QueryResultRow = any> {
  rows: T[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: any[];
}

export interface PoolClient {
  query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  release(destroy?: boolean | Error): void;
}

export interface Pool extends EventEmitter {
  connect(): Promise<PoolClient>;
  query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  end(): Promise<void>;
}

// Programmatic .env.local loader for script execution contexts where Next.js environment is not initialized
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

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) return poolInstance;

  // Run .env.local loader before checking environment variables
  loadEnvLocal();

  // Dynamically load 'pg' module to prevent compilation failures when type links are missing
   
  const pg = require('pg');
  const maxPoolSize = process.env.FPV_DB_POOL_MAX 
    ? parseInt(process.env.FPV_DB_POOL_MAX, 10) 
    : 3;

  const connectionString = process.env.FPV_DATABASE_URL;

  let rawPool: any;
  if (connectionString) {
    console.log('Initializing PostgreSQL pool using connection string (max pool size:', maxPoolSize, ')');
    rawPool = new pg.Pool({
      connectionString,
      max: maxPoolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } else {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
    const user = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_DATABASE;

    if (!host || !database) {
      console.warn('DB configuration missing in environment. Lazy pool initialization deferred.');
    }

    console.log(`Initializing PostgreSQL pool with host ${host}:${port}/${database} (max pool size: ${maxPoolSize})`);
    rawPool = new pg.Pool({
      host,
      port,
      user,
      password,
      database,
      max: maxPoolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  rawPool.on('error', (err: Error) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  poolInstance = rawPool as Pool;
  return poolInstance;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const activePool = getPool();
  return activePool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const activePool = getPool();
  return activePool.connect();
}

export async function checkDbHealth(): Promise<{ healthy: boolean; error?: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const res = await query('SELECT 1 as ok');
    const latencyMs = Date.now() - start;
    const healthy = res.rows[0]?.ok === 1;
    return { healthy, latencyMs };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    return { healthy: false, error: err };
  }
}

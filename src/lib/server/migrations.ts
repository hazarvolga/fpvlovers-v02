import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getClient } from './db';
import type { PoolClient } from './db';

// Advisory lock ID for migrations — prevents concurrent runs.
const MIGRATION_LOCK_ID = 2147483647;

export interface MigrationFile {
  version: string;
  name: string;
  filePath: string;
  checksum: string;
}

export interface MigrationResult {
  applied: string[];
  alreadyApplied: string[];
  skipped: string[];
}

function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function discoverMigrationFiles(migrationsDir: string): MigrationFile[] {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = file.match(/^(\d+)_(.+)\.sql$/);

      if (!match) {
        throw new Error(`[Migrations] Invalid migration filename pattern: "${file}". Expected format "0001_name.sql".`);
      }

      return {
        version: match[1],
        name: match[2],
        filePath,
        checksum: calculateChecksum(content),
      };
    });
}

export async function executeMigrationPlan(
  client: PoolClient,
  migrations: MigrationFile[],
): Promise<MigrationResult> {
  const appliedMap = new Map<string, string>();
  const applied: string[] = [];
  const alreadyApplied: string[] = [];
  const skipped: string[] = [];
  let lockAcquired = false;
  let transactionActive = false;
  let primaryError: unknown;
  let unlockError: unknown;

  try {
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS fpvlovers_app;
      CREATE TABLE IF NOT EXISTS fpvlovers_app.schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    lockAcquired = true;
    console.log('[Migrations] Acquired advisory lock.');

    const appliedRows = await client.query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM fpvlovers_app.schema_migrations ORDER BY version ASC',
    );
    for (const row of appliedRows.rows) {
      appliedMap.set(row.version, row.checksum);
    }

    for (const migration of migrations) {
      const existingChecksum = appliedMap.get(migration.version);
      if (existingChecksum !== undefined) {
        if (existingChecksum !== migration.checksum) {
          console.warn(`[Migrations] WARNING: Migration ${migration.version}_${migration.name} checksum mismatch!`);
          console.warn(`[Migrations] Database has:  ${existingChecksum}`);
          console.warn(`[Migrations] Local file has: ${migration.checksum}`);
        }
        alreadyApplied.push(migration.version);
        continue;
      }

      console.log(`[Migrations] Running migration: ${migration.version}_${migration.name}...`);
      const sql = fs.readFileSync(migration.filePath, 'utf-8');
      await client.query('BEGIN');
      transactionActive = true;
      await client.query(sql);
      await client.query(
        'INSERT INTO fpvlovers_app.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.name, migration.checksum],
      );
      await client.query('COMMIT');
      transactionActive = false;
      console.log(`[Migrations] Successfully applied migration: ${migration.version}_${migration.name}`);
      applied.push(migration.version);
    }
  } catch (error: unknown) {
    primaryError = error;
    if (transactionActive) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError: unknown) {
        console.error('[Migrations] Failed to roll back active migration transaction:', rollbackError);
      } finally {
        transactionActive = false;
      }
    }
  } finally {
    if (lockAcquired) {
      try {
        const unlockResult = await client.query<{ pg_advisory_unlock: boolean }>(
          'SELECT pg_advisory_unlock($1) AS pg_advisory_unlock',
          [MIGRATION_LOCK_ID],
        );
        if (unlockResult.rows[0]?.pg_advisory_unlock !== true) {
          unlockError = new Error('[Migrations] Advisory lock was not held by the migration client during unlock.');
          console.error(unlockError);
        } else {
          console.log('[Migrations] Released advisory lock.');
        }
      } catch (error: unknown) {
        unlockError = error;
        console.error('[Migrations] Failed to release advisory lock:', error);
      }
    }
    client.release();
  }

  if (primaryError !== undefined) {
    throw primaryError;
  }
  if (unlockError !== undefined) {
    throw unlockError;
  }

  return { applied, alreadyApplied, skipped };
}

export async function runMigrations(options: { dryRun?: boolean } = {}): Promise<MigrationResult> {
  console.log(`[Migrations] Starting database migration runner (dryRun: ${!!options.dryRun})...`);

  const migrationsDir = path.join(process.cwd(), 'db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migrations] No migrations directory found. Skipping.');
    return { applied: [], alreadyApplied: [], skipped: [] };
  }

  // 1. Gather all SQL files from directory
  const migrations = discoverMigrationFiles(migrationsDir);

  if (migrations.length === 0) {
    console.log('[Migrations] No migration files found.');
    return { applied: [], alreadyApplied: [], skipped: [] };
  }

  const applied: string[] = [];
  if (options.dryRun) {
    for (const migration of migrations) {
      console.log(`[Migrations] Running migration: ${migration.version}_${migration.name}...`);
      console.log(`[Migrations] [Dry Run] Would apply: ${migration.version}_${migration.name}`);
      applied.push(migration.version);
    }
    console.log(`[Migrations] Completed. Applied: ${applied.length}, Already Applied: 0`);
    return { applied, alreadyApplied: [], skipped: [] };
  }

  const client = await getClient();
  const result = await executeMigrationPlan(client, migrations);
  console.log(`[Migrations] Completed. Applied: ${result.applied.length}, Already Applied: ${result.alreadyApplied.length}`);
  return result;
}

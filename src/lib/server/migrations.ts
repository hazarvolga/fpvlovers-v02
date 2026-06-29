import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { query, getClient } from './db';

// Advisory lock ID for migrations — prevents concurrent runs.
const MIGRATION_LOCK_ID = 2147483647;

export interface MigrationFile {
  version: string;
  name: string;
  filePath: string;
  checksum: string;
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

export async function runMigrations(options: { dryRun?: boolean } = {}): Promise<{
  applied: string[];
  alreadyApplied: string[];
  skipped: string[];
}> {
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

  const appliedMap = new Map<string, string>();

  if (!options.dryRun) {
    // 2. Ensure schema_migrations table exists (run inline if not initialized)
    try {
      await query(`
        CREATE SCHEMA IF NOT EXISTS fpvlovers_app;
        CREATE TABLE IF NOT EXISTS fpvlovers_app.schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    } catch (err) {
      console.error('[Migrations] Failed to ensure schema_migrations table exists:', err);
      throw err;
    }

    // 2b. Acquire advisory lock to prevent concurrent migrations
    try {
      await query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
      console.log('[Migrations] Acquired advisory lock.');
    } catch (err) {
      console.error('[Migrations] Failed to acquire advisory lock:', err);
      throw err;
    }

    // 3. Fetch already applied migrations
    const appliedRows = await query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM fpvlovers_app.schema_migrations ORDER BY version ASC'
    );
    
    for (const row of appliedRows.rows) {
      appliedMap.set(row.version, row.checksum);
    }
  }

  const applied: string[] = [];
  const alreadyApplied: string[] = [];
  const skipped: string[] = [];

  try {
    // 4. Run migrations in sequence
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

      if (options.dryRun) {
        console.log(`[Migrations] [Dry Run] Would apply: ${migration.version}_${migration.name}`);
        applied.push(migration.version);
        continue;
      }

      // Execute in a transaction
      const client = await getClient();
      try {
        await client.query('BEGIN');
        
        // Execute the migration content
        await client.query(sql);
        
        // Record applied migration
        await client.query(
          'INSERT INTO fpvlovers_app.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [migration.version, migration.name, migration.checksum]
        );
        
        await client.query('COMMIT');
        console.log(`[Migrations] Successfully applied migration: ${migration.version}_${migration.name}`);
        applied.push(migration.version);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migrations] Failed to apply migration ${migration.version}_${migration.name}. Transaction rolled back.`, err);
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    // 5. Release advisory lock
    if (!options.dryRun) {
      try {
        await query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
        console.log('[Migrations] Released advisory lock.');
      } catch (unlockErr) {
        console.warn('[Migrations] Failed to release advisory lock:', unlockErr);
      }
    }
  }

  console.log(`[Migrations] Completed. Applied: ${applied.length}, Already Applied: ${alreadyApplied.length}`);
  return { applied, alreadyApplied, skipped };
}

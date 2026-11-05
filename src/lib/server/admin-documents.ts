import fs from 'fs';
import path from 'path';
import { query } from '@/lib/server/db';
import { getStorageMode } from '@/lib/server/storage-mode';
import { safeReadJson } from '@/lib/utils/json';

export type AdminDocumentName =
  | 'affiliates'
  | 'sponsors'
  | 'campaigns'
  | 'ctas'
  | 'campaignMetrics'
  | 'trustScores'
  | 'intentProfiles';

function dataDir(): string {
  return process.env.FPV_ADMIN_DOCS_DIR || path.join(process.cwd(), 'data');
}

function filePath(name: AdminDocumentName): string {
  return path.join(dataDir(), `${name}.json`);
}

// Synchronous readers (monetizationOrchestrator, agents) still consume the
// JSON files, so the database copy is mirrored back to disk on a best-effort
// basis. The database stays the source of truth.
function mirrorToFile(name: AdminDocumentName, data: unknown): void {
  try {
    fs.writeFileSync(filePath(name), `${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    console.warn(`[admin-documents] Could not mirror ${name} to disk:`, error);
  }
}

async function upsert(name: AdminDocumentName, data: unknown): Promise<void> {
  await query(
    `INSERT INTO fpvlovers_app.admin_documents (name, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [name, JSON.stringify(data)]
  );
}

export async function readAdminDocument<T>(name: AdminDocumentName, fallback: T): Promise<T> {
  const seed = safeReadJson<T>(filePath(name), fallback);
  if (getStorageMode() === 'files') return seed;

  try {
    const result = await query<{ data: T }>(
      'SELECT data FROM fpvlovers_app.admin_documents WHERE name = $1',
      [name]
    );
    if (result.rows.length > 0) {
      mirrorToFile(name, result.rows[0].data);
      return result.rows[0].data;
    }
    await upsert(name, seed);
    return seed;
  } catch (error) {
    console.error(`[admin-documents] Database read failed for ${name}; using file copy:`, error);
    return seed;
  }
}

export async function writeAdminDocument(name: AdminDocumentName, data: unknown): Promise<void> {
  if (getStorageMode() !== 'files') {
    await upsert(name, data);
  }
  mirrorToFile(name, data);
}

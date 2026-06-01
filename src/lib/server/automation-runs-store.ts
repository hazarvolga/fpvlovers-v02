import { query } from './db';
import { getStorageMode } from './storage-mode';

export interface AutomationRunInput {
  kind: string; // 'crawl' or 'generate'
  status: string; // 'enqueued', 'noop', 'failed', 'blocked', 'published', 'queued'
  startedAt?: Date;
  finishedAt?: Date;
  summary?: any;
  errorMessage?: string;
}

export async function logAutomationRun(run: AutomationRunInput): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'files') return; // Do nothing in files mode

  try {
    await query(`
      INSERT INTO fpvlovers_app.automation_runs (
        kind, status, started_at, finished_at, summary, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      run.kind,
      run.status,
      run.startedAt || new Date(),
      run.finishedAt || new Date(),
      run.summary || {},
      run.errorMessage || null
    ]);
  } catch (err) {
    console.error('[DB Store] Failed to log automation run:', err);
  }
}

export async function getRecentAutomationRuns(kind?: string, limit: number = 10): Promise<any[]> {
  const mode = getStorageMode();
  if (mode === 'files') return [];

  try {
    let sql = `
      SELECT id, kind, status, started_at as "startedAt", finished_at as "finishedAt", summary, error_message as "errorMessage"
      FROM fpvlovers_app.automation_runs
    `;
    const params: any[] = [];
    if (kind) {
      sql += ` WHERE kind = $1 `;
      params.push(kind);
    }
    sql += ` ORDER BY started_at DESC LIMIT $${params.length + 1} `;
    params.push(limit);

    const res = await query(sql, params);
    return res.rows;
  } catch (err) {
    console.error('[DB Store] Failed to get recent automation runs:', err);
    return [];
  }
}

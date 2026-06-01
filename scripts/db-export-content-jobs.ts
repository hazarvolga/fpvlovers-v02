import { query, getPool } from '../src/lib/server/db';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'data', 'content-jobs.json');

async function dbExportContentJobs() {
  console.log('[Export Content Jobs] Querying content jobs from PostgreSQL...');

  try {
    await query('SELECT 1');
  } catch (err: any) {
    console.warn('\n[Export Content Jobs] PostgreSQL database is offline. Skipping export gracefully.');
    console.log(`Database health detail: ${err.message}`);
    return;
  }

  try {
    const res = await query(`
      SELECT 
        id, status, topic, keyword, intent, language, title, slug as "briefSlug",
        brief, draft, publish_artifact, error_message, attempt_count,
        scheduled_for, started_at, completed_at, created_at as "createdAt", updated_at as "updatedAt"
      FROM fpvlovers_app.content_jobs
      ORDER BY updated_at DESC
    `);

    const jobs = res.rows.map((row: any) => {
      const briefObj = row.brief || {};
      return {
        id: row.id,
        briefSlug: row.briefSlug || '',
        title: row.title || '',
        category: briefObj.category || 'Flight Guides',
        status: row.status,
        topic: row.topic || '',
        language: row.language,
        template: briefObj.template || 'tech-article',
        promptVersion: briefObj.promptVersion || 'v2',
        sourceHints: Array.isArray(briefObj.sourceHints) ? briefObj.sourceHints : [],
        seo: briefObj.seo || {
          slug: row.briefSlug || '',
          metaDescription: row.topic || '',
          keywords: []
        },
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
        publishedPath: row.publish_artifact?.publishedPath || undefined,
        error_message: row.error_message || undefined,
        attempt_count: row.attempt_count || 0
      };
    });

    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jobs, null, 2) + '\n', 'utf-8');
    console.log(`[Export Content Jobs] Successfully exported ${jobs.length} jobs to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('[Export Content Jobs] Export failed:', err);
  } finally {
    try {
      const pool = getPool();
      await pool.end();
      console.log('[Export Content Jobs] Database connection pool closed.');
    } catch (endError) {
      console.error('[Export Content Jobs] Error closing connection pool:', endError);
    }
  }
}

dbExportContentJobs();

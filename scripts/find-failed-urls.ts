import { query } from '../src/lib/server/db';

async function main() {
  console.log('Querying raw_content for failed URLs...');
  try {
    const res = await query('SELECT url, status, error_message, updated_at FROM content_engine.raw_content WHERE status = $1', ['failed']);
    console.log(`Found ${res.rowCount} failed URLs.`);
    if (res.rowCount && res.rowCount > 0) {
      console.log('Failed URLs:');
      for (const row of res.rows) {
        console.log(`- ${row.url} (Error: ${row.error_message})`);
      }
    }
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    process.exit(0);
  }
}

main();

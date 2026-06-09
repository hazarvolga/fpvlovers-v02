import { Pool } from 'pg';

async function main() {
  console.log('Connecting to Dify PostgreSQL via tunnel on 5435...');
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5435,
    user: 'postgres',
    password: 'difyai123456',
    database: 'dify',
    connectionTimeoutMillis: 5000,
  });

  try {
    // 1. Get raw_content columns
    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'content_engine' AND table_name = 'raw_content';
    `);
    console.log('Columns:');
    console.log(columnsRes.rows.map(r => `${r.column_name} (${r.data_type})`));

    // 2. Count total rows and active/inactive rows
    const countRes = await pool.query(`
      SELECT is_active, COUNT(*) as count 
      FROM content_engine.raw_content 
      GROUP BY is_active;
    `);
    console.log('\nis_active counts:');
    console.log(countRes.rows);

    // 3. Print 3 sample rows
    const sampleRes = await pool.query(`
      SELECT id, url, is_active, length(raw_markdown) as md_len 
      FROM content_engine.raw_content 
      LIMIT 3;
    `);
    console.log('\nSamples:');
    console.log(sampleRes.rows);

    // 4. Test a query using URL and check if is_active is true/false or if there are matches
    const urlsRes = await pool.query(`
      SELECT url, is_active FROM content_engine.raw_content LIMIT 10;
    `);
    console.log('\nTop 10 URLs:');
    console.log(urlsRes.rows);

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();

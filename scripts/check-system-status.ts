import { checkCrawlerHealth } from '../src/lib/crawler-health';

async function main() {
  console.log('--- SYSTEM REAL-TIME HEALTH DIAGNOSTICS ---');

  // 1. Check Crawl4AI Primary & Backup health
  console.log('Checking Crawl4AI servers...');
  const crawlers = await checkCrawlerHealth(10000);
  console.log('\n[Crawler Status]');
  for (const c of crawlers) {
    console.log(`- ${c.name} (${c.role.toUpperCase()}):`);
    console.log(`  Status:    ${c.status.toUpperCase()}`);
    console.log(`  Latency:   ${c.latencyMs}ms`);
    console.log(`  URL:       ${c.checkedUrl}`);
    console.log(`  Version:   ${c.version}`);
    if (c.error) {
      console.log(`  Error:     ${c.error}`);
    }
  }

  // 2. Check Dify API Gateway & Web Console
  console.log('\nChecking Dify service endpoints...');
  const difyEndpoints = [
    { name: 'Dify API Gateway', url: 'https://dify.affexai.tr/v1' },
    { name: 'Dify Web UI Console', url: 'https://dify.affexai.tr' }
  ];

  console.log('\n[Dify Status]');
  for (const d of difyEndpoints) {
    const t0 = Date.now();
    try {
      const resp = await fetch(d.url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      const duration = Date.now() - t0;
      console.log(`- ${d.name}:`);
      console.log(`  Status:    ${resp.ok || resp.status === 302 || resp.status === 401 || resp.status === 404 ? 'ONLINE' : 'DEGRADED'}`);
      console.log(`  HTTP Code: ${resp.status}`);
      console.log(`  Latency:   ${duration}ms`);
      console.log(`  URL:       ${d.url}`);
    } catch (err: any) {
      console.log(`- ${d.name}:`);
      console.log(`  Status:    OFFLINE`);
      console.log(`  Error:     ${err.message}`);
      console.log(`  URL:       ${d.url}`);
    }
  }

  console.log('\n--- DIAGNOSTICS COMPLETED ---');
}

main().catch(console.error);

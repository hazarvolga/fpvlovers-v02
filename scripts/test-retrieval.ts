import { DATASETS } from '../src/lib/master-routing-tables';
import fs from 'fs';

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'dataset-57xGhkCvaQKR2YoSljA94NVu';

const TEST_QUERIES: Record<string, string[]> = {
  'fpv-flight-tuning': ['pid tuning best practices', 'propwash fix', 'blackbox analysis guide'],
  'fpv-pid-profiles': ['betaflight 4.4 pid profile', 'cinewhoop pid tune'],
  'fpv-troubleshooting': ['drone flipping on takeoff', 'video loss mid flight', 'esc desync'],
  'fpv-components-specs': ['speedybee f405 v3 specs', 'gemfan 51466 weight', 'tbs crossfire micro tx power'],
  'fpv-build-guides': ['how to build a 5 inch drone', 'soldering esc to flight controller'],
  'fpv-news-reviews': ['dji o4 air unit review', 'new fatshark goggles 2025'],
  'fpv-racing-events': ['fai drone racing world cup 2025', 'multigp global qualifier tracks'],
  'fpv-community-knowledge': ['how to practice in liftoff', 'best drone for beginners'],
  'fpv-regulations': ['faa remote id rules', 'shgm iha kayit 2025', 'easa open category drones']
};

async function testRetrieval() {
  console.log('--- STARTING RETRIEVAL QUALITY TEST ---');
  
  const results: any = {};
  
  for (const ds of DATASETS) {
    console.log(`\nTesting Dataset: ${ds.name} (${ds.id})`);
    const queries = TEST_QUERIES[ds.name] || ['fpv drone'];
    
    results[ds.name] = { queries: {} };
    
    for (const query of queries) {
      console.log(`  Query: "${query}"`);
      try {
        const response = await fetch(`${DIFY_BASE_URL}/datasets/${ds.uuid}/retrieve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        if (!response.ok) {
          const err = await response.text();
          console.log(`    Error: ${response.status} - ${err}`);
          results[ds.name].queries[query] = { error: err, status: response.status };
          continue;
        }
        
        const data = await response.json();
        const records = data.records || [];
        
        console.log(`    Results: ${records.length} records retrieved.`);
        
        if (records.length > 0) {
          const topScore = records[0].score || 0;
          console.log(`    Top Score: ${topScore.toFixed(3)}`);
        }
        
        results[ds.name].queries[query] = {
          count: records.length,
          topScore: records.length > 0 ? records[0].score : 0,
        };
      } catch (e: any) {
        console.log(`    Exception: ${e.message}`);
      }
      
      // Delay to respect rate limit (1.5s interval)
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  fs.writeFileSync('reports/retrieval-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n--- RETRIEVAL TEST COMPLETE ---');
  console.log('Results saved to reports/retrieval-test-results.json');
}

testRetrieval();

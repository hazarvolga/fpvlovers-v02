import { DATASETS } from '../src/lib/master-routing-tables';
import { difyRequest } from '../src/lib/dify-client';
import fs from 'fs';

interface RetrievalRecord {
  score?: number;
}

interface RetrievalQueryResult {
  count?: number;
  topScore?: number;
  error?: string;
  status?: string;
}

type RetrievalResults = Record<string, { queries: Record<string, RetrievalQueryResult> }>;

function readRecords(value: unknown): RetrievalRecord[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const records = (value as Record<string, unknown>).records;
  if (!Array.isArray(records)) return [];
  return records.filter((record): record is RetrievalRecord => (
    Boolean(record) && typeof record === 'object' && !Array.isArray(record)
  ));
}

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
  
  const results: RetrievalResults = {};
  
  for (const ds of DATASETS) {
    console.log(`\nTesting Dataset: ${ds.name} (${ds.id})`);
    const queries = TEST_QUERIES[ds.name] || ['fpv drone'];
    
    results[ds.name] = { queries: {} };
    
    for (const query of queries) {
      console.log(`  Query: "${query}"`);
      try {
        const response = await difyRequest(`/datasets/${ds.uuid}/retrieve`, {
          method: 'POST',
          body: { query },
          taskType: 'rag_query',
        });
        
        if (!response.ok) {
          const error = response.error || 'Unknown Dify retrieval error';
          console.log(`    Error: ${response.status} - ${error}`);
          results[ds.name].queries[query] = { error, status: response.status };
          continue;
        }
        
        const records = readRecords(response.data);
        
        console.log(`    Results: ${records.length} records retrieved.`);
        
        if (records.length > 0) {
          const topScore = records[0].score || 0;
          console.log(`    Top Score: ${topScore.toFixed(3)}`);
        }
        
        results[ds.name].queries[query] = {
          count: records.length,
          topScore: records.length > 0 ? records[0].score : 0,
        };
      } catch (error: unknown) {
        console.log(`    Exception: ${error instanceof Error ? error.message : String(error)}`);
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

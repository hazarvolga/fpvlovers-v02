import { getPool, query } from '../src/lib/server/db';
import { purgeExpiredPrivacyData } from '../src/lib/server/privacy-retention';

async function main() {
  try {
    const result = await purgeExpiredPrivacyData(query);
    console.log('[Privacy Retention] Purged expired records:', JSON.stringify(result));
  } catch (error) {
    console.error('[Privacy Retention] Cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await getPool().end();
    } catch (error) {
      console.error('[Privacy Retention] Error closing database pool:', error);
    }
  }
}

void main();

import * as fs from 'fs';
import * as path from 'path';

interface ContentJob {
  id: string;
  status: string;
  topic?: string;
  keyword?: string;
  intent?: string;
  language?: string;
  title?: string;
  slug?: string;
  brief?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  publish_artifact?: Record<string, unknown>;
  error_message?: string;
  attempt_count?: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface CrawlJob {
  id: string;
  url: string;
  dataset_id?: string;
  dataset_key?: string;
  status: string;
  priority?: number;
  source?: string;
  source_pack?: string;
  retry_count?: number;
  next_attempt_at?: string;
  last_attempt_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface AuditReport {
  timestamp: string;
  contentJobs: {
    total: number;
    byStatus: Record<string, number>;
    invalidRecords: number;
  };
  crawlQueue: {
    total: number;
    byStatus: Record<string, number>;
    invalidRecords: number;
  };
  publishedContent: {
    totalJson: number;
    totalMd: number;
    matchingPairs: number;
    orphanedJson: string[];
    orphanedMd: string[];
    duplicateSlugs: string[];
  };
  productCatalog: {
    totalItems: number;
    inferredType: 'components' | 'products' | 'mixed' | 'unknown';
    keysFound: string[];
  };
  monetization: {
    affiliatesCount: number;
    sponsorsCount: number;
    campaignsCount: number;
    campaignMetricsCount: number;
    trustScoresCount: number;
  };
}

const DATA_DIR = path.join(__dirname, '../data');
const PUBLISHED_DIR = path.join(__dirname, '../content/published');
const REPORTS_DIR = path.join(__dirname, '../reports');

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    return null;
  }
}

function runAudit() {
  console.log('Starting file-based storage audit...');

  // 1. Content Jobs Audit
  const contentJobsFile = path.join(DATA_DIR, 'content-jobs.json');
  const contentJobs = safeReadJson<ContentJob[]>(contentJobsFile) || [];
  const contentJobsByStatus: Record<string, number> = {};
  let invalidContentJobs = 0;

  for (const job of contentJobs) {
    if (!job.id || !job.status) {
      invalidContentJobs++;
      continue;
    }
    contentJobsByStatus[job.status] = (contentJobsByStatus[job.status] || 0) + 1;
  }

  // 2. Crawl Queue Audit
  const crawlQueueFile = path.join(DATA_DIR, 'crawl-queue.json');
  const crawlQueueData = safeReadJson<{ jobs?: CrawlJob[] }>(crawlQueueFile);
  const crawlQueue = crawlQueueData?.jobs || [];
  const crawlQueueByStatus: Record<string, number> = {};
  let invalidCrawlJobs = 0;

  for (const job of crawlQueue) {
    if (!job.id || !job.url || !job.status) {
      invalidCrawlJobs++;
      continue;
    }
    crawlQueueByStatus[job.status] = (crawlQueueByStatus[job.status] || 0) + 1;
  }

  // 3. Published Content Audit
  let totalJson = 0;
  let totalMd = 0;
  const jsonSlugs: string[] = [];
  const mdSlugs: string[] = [];

  if (fs.existsSync(PUBLISHED_DIR)) {
    const files = fs.readdirSync(PUBLISHED_DIR);
    for (const file of files) {
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      if (ext === '.json') {
        totalJson++;
        jsonSlugs.push(base);
      } else if (ext === '.md') {
        totalMd++;
        mdSlugs.push(base);
      }
    }
  }

  const orphanedJson = jsonSlugs.filter(slug => !mdSlugs.includes(slug));
  const orphanedMd = mdSlugs.filter(slug => !jsonSlugs.includes(slug));
  const matchingPairs = jsonSlugs.filter(slug => mdSlugs.includes(slug)).length;

  const duplicateSlugs: string[] = [];
  const uniqueJsonSlugs = new Set<string>();
  for (const slug of jsonSlugs) {
    if (uniqueJsonSlugs.has(slug)) {
      duplicateSlugs.push(slug);
    } else {
      uniqueJsonSlugs.add(slug);
    }
  }

  // 4. Product Catalog Shape Analysis
  const catalogFile = path.join(DATA_DIR, 'fpv-products.catalog.json');
  const catalog = safeReadJson<unknown>(catalogFile);
  let totalCatalogItems = 0;
  let catalogType: 'components' | 'products' | 'mixed' | 'unknown' = 'unknown';
  let keysFound: string[] = [];

  if (catalog) {
    if (Array.isArray(catalog)) {
      totalCatalogItems = catalog.length;
      if (totalCatalogItems > 0) {
        const firstItem = catalog[0] as Record<string, unknown>;
        keysFound = Object.keys(firstItem);
        const hasCommercialKeys = keysFound.some(k => ['price', 'url', 'merchant', 'affiliate'].includes(k));
        const hasSpecKeys = keysFound.some(k => ['specs', 'category', 'stator', 'kv', 'weight'].includes(k));
        if (hasCommercialKeys && hasSpecKeys) {
          catalogType = 'mixed';
        } else if (hasCommercialKeys) {
          catalogType = 'products';
        } else if (hasSpecKeys) {
          catalogType = 'components';
        }
      }
    } else if (typeof catalog === 'object') {
      keysFound = Object.keys(catalog);
      catalogType = 'components'; // key-value specs
      totalCatalogItems = keysFound.length;
    }
  }

  // 5. Monetization & Metrics Counts
  const affiliates = safeReadJson<unknown[]>(path.join(DATA_DIR, 'affiliates.json')) || [];
  const sponsors = safeReadJson<unknown[]>(path.join(DATA_DIR, 'sponsors.json')) || [];
  const campaigns = safeReadJson<unknown[]>(path.join(DATA_DIR, 'campaigns.json')) || [];
  const campaignMetrics = safeReadJson<Record<string, unknown>>(path.join(DATA_DIR, 'campaignMetrics.json')) || {};
  const trustScores = safeReadJson<Record<string, unknown>>(path.join(DATA_DIR, 'trustScores.json')) || {};

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    contentJobs: {
      total: contentJobs.length,
      byStatus: contentJobsByStatus,
      invalidRecords: invalidContentJobs,
    },
    crawlQueue: {
      total: crawlQueue.length,
      byStatus: crawlQueueByStatus,
      invalidRecords: invalidCrawlJobs,
    },
    publishedContent: {
      totalJson,
      totalMd,
      matchingPairs,
      orphanedJson,
      orphanedMd,
      duplicateSlugs,
    },
    productCatalog: {
      totalItems: totalCatalogItems,
      inferredType: catalogType,
      keysFound,
    },
    monetization: {
      affiliatesCount: affiliates.length,
      sponsorsCount: sponsors.length,
      campaignsCount: campaigns.length,
      campaignMetricsCount: Object.keys(campaignMetrics).length,
      trustScoresCount: Object.keys(trustScores).length,
    },
  };

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, 'db-file-storage-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Audit report successfully written to ${reportPath}`);
  console.log(JSON.stringify(report, null, 2));
}

runAudit();

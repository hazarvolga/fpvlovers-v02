import fs from 'node:fs';
import path from 'node:path';

type RecordLike = Record<string, unknown>;

const dataPath = (name: string) => path.join(process.cwd(), 'data', name);

function readJson(name: string): unknown {
  return JSON.parse(fs.readFileSync(dataPath(name), 'utf8')) as unknown;
}

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function evidenceUrls(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isHttpUrl) : [];
}

const affiliateRaw = readJson('affiliates.json');
const affiliateRows = Array.isArray(affiliateRaw)
  ? affiliateRaw.map(asRecord).filter((row): row is RecordLike => Boolean(row))
  : [];
const activeRows = affiliateRows.filter((row) => asBoolean(row.active));
const explicitlyVerified = activeRows.filter((row) => asBoolean(row.affiliateUrlVerified));
const eligibleRows = explicitlyVerified.filter((row) =>
  isHttpUrl(row.url) && evidenceUrls(row.verificationEvidence).length > 0,
);
const invalidVerifiedRows = explicitlyVerified.filter((row) =>
  !isHttpUrl(row.url) || evidenceUrls(row.verificationEvidence).length === 0,
);

const crawlerRaw = readJson('fpv-products.catalog.json');
const crawlerRecord = asRecord(crawlerRaw);
const crawlerRows = crawlerRecord && Array.isArray(crawlerRecord.products)
  ? crawlerRecord.products.map(asRecord).filter((row): row is RecordLike => Boolean(row))
  : [];
const crawlerWithEvidence = crawlerRows.filter((row) => {
  const evidence = asRecord(row.evidenceSpecs);
  return Boolean(evidence && Object.keys(evidence).length > 0);
});

const report = {
  generatedAt: new Date().toISOString(),
  status: invalidVerifiedRows.length === 0 && eligibleRows.length > 0 ? 'ready-for-verified-rows' : 'blocked-pending-network-verification',
  affiliateSeeds: {
    total: affiliateRows.length,
    active: activeRows.length,
    explicitlyVerified: explicitlyVerified.length,
    eligibleForAffiliateCTA: eligibleRows.length,
    quarantinedPendingVerification: activeRows.length - eligibleRows.length,
    invalidExplicitVerification: invalidVerifiedRows.map((row) => asString(row.id) || 'unknown'),
  },
  crawlerCatalog: {
    total: crawlerRows.length,
    withEvidenceSpecs: crawlerWithEvidence.length,
    withoutEvidenceSpecs: crawlerRows.length - crawlerWithEvidence.length,
  },
  policy: [
    'affiliateUrlVerified must be true only after the network account and destination are manually checked',
    'verificationEvidence must contain at least one HTTP(S) proof URL',
    'unverified rows remain source/research only and are never emitted by getRecommendations',
  ],
};

console.log(JSON.stringify(report, null, 2));
if (invalidVerifiedRows.length > 0) process.exitCode = 1;

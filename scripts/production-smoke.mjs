#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(process.env.SMOKE_BASE_URL || 'https://fpvlovers.com.tr');
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;

const checks = [
  {
    name: 'homepage',
    method: 'GET',
    path: '/',
    expect: async (res, body) => {
      assertStatus(res, 200);
      assertHeaderIncludes(res, 'content-type', 'text/html');
      assert(body.includes('FPV') || body.includes('fpv'), 'homepage should include FPV copy');
      assert(body.includes('Editorial index'), 'homepage should expose editorial archive context');
      assert(body.includes('Browse all'), 'homepage should expose the archive CTA');
      assert((body.match(/data-testid="latest-content-card"/g) || []).length >= 6, 'homepage should expose at least six latest content cards');
      assert(!body.includes('LINK ACTIVE') && !body.includes('SYS.SCANNER: STANDBY'), 'public homepage should not expose internal telemetry labels');
    },
  },
  {
    name: 'public health',
    method: 'GET',
    path: '/api/health',
    expect: async (res, body) => {
      assertStatus(res, 200);
      assertHeaderIncludes(res, 'content-type', 'application/json');
      const json = parseJson(body);
      assert(json.status === 'ok', 'health status should be ok');
      assert(json.service === 'fpvlovers-frontend', 'health service should identify frontend');
    },
  },
  {
    name: 'public readiness',
    method: 'GET',
    path: '/api/ready',
    expect: async (res, body) => {
      assertStatus(res, 200);
      const json = parseJson(body);
      assert(json.status === 'ready', 'readiness status should be ready');
      assert(Array.isArray(json.checks), 'readiness should include dependency checks');
    },
  },
  {
    name: 'robots',
    method: 'GET',
    path: '/robots.txt',
    expect: async (res, body) => {
      assertStatus(res, 200);
      assert(body.includes('User-Agent') || body.includes('user-agent'), 'robots should include user-agent rules');
    },
  },
  {
    name: 'sitemap',
    method: 'GET',
    path: '/sitemap.xml',
    expect: async (res, body) => {
      assertStatus(res, 200);
      assert(body.includes('<urlset') || body.includes('<sitemapindex'), 'sitemap should be XML sitemap content');
    },
  },
  {
    name: 'admin page requires auth',
    method: 'GET',
    path: '/admin',
    expect: async (res) => {
      assertStatus(res, 401);
      assertHeaderIncludes(res, 'www-authenticate', 'Basic');
    },
  },
  {
    name: 'admin API requires auth',
    method: 'GET',
    path: '/api/admin/health',
    expect: async (res) => {
      assertStatus(res, 401);
      assertHeaderIncludes(res, 'www-authenticate', 'Basic');
    },
  },
];

if (adminUser && adminPass) {
  checks.push({
    name: 'admin API authenticated health',
    method: 'GET',
    path: '/api/admin/health',
    headers: {
      authorization: `Basic ${Buffer.from(`${adminUser}:${adminPass}`).toString('base64')}`,
    },
    expect: async (res, body) => {
      assertStatus(res, 200);
      const json = parseJson(body);
      assert(['healthy', 'degraded', 'critical'].includes(json.status), 'admin health should return a known status');
      assert(Array.isArray(json.services), 'admin health should include services');
    },
  });
}

const startedAt = Date.now();
const results = [];

for (const check of checks) {
  const result = await runCheck(check);
  results.push(result);
  const icon = result.ok ? 'PASS' : 'FAIL';
  const suffix = result.ok ? `${result.status} ${result.ms}ms` : result.error;
  console.log(`${icon} ${result.name} - ${suffix}`);
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed in ${Date.now() - startedAt}ms`);

if (!adminUser || !adminPass) {
  console.log('INFO Admin credential check skipped. Set ADMIN_USER and ADMIN_PASS to enable it.');
}

if (failed.length > 0) {
  process.exitCode = 1;
}

async function runCheck(check) {
  const started = Date.now();
  try {
    const res = await fetch(new URL(check.path, baseUrl), {
      method: check.method,
      headers: check.headers,
      redirect: 'follow',
    });
    const body = await res.text();
    await check.expect(res, body);
    return {
      ok: true,
      name: check.name,
      status: res.status,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      name: check.name,
      error: error instanceof Error ? error.message : String(error),
      ms: Date.now() - started,
    };
  }
}

function normalizeBaseUrl(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function assertStatus(res, expected) {
  assert(res.status === expected, `expected status ${expected}, got ${res.status}`);
}

function assertHeaderIncludes(res, header, expected) {
  const actual = res.headers.get(header) || '';
  assert(actual.toLowerCase().includes(expected.toLowerCase()), `expected ${header} to include ${expected}, got ${actual || '<empty>'}`);
}

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`expected JSON body, got ${body.slice(0, 120)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

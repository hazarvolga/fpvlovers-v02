// Dify API Client — Rate-Limit, Budget, Dry-Run, Cache + Groq Fallback
import fs from 'fs';
import path from 'path';
import { getOptionalEnv, getRequiredEnv } from '@/lib/env';
import { getCached, setCached, hashInput } from './llm-cache';

const USAGE_FILE = path.join(process.cwd(), 'data', 'embedding-usage.json');
const BUDGET_LOG = path.join(process.cwd(), 'data', 'api-budget-log.json');

// ─── TYPES ───

export type TaskType = 'embed' | 'classify' | 'metadata' | 'rag_query' | 'content_gen';

interface EmbeddingBudget {
  daily_limit: number;
  used_today: number;
  reset_at: string;
  last_call_ts: number;
  calls_today: number;
  errors_today: number;
  groq_calls_today: number;
  history: { ts: string; tokens: number; endpoint: string; status: string }[];
}

interface BudgetLogEntry {
  ts: string;
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'throttled' | 'dry_run';
  duration_ms: number;
  tokens?: number;
  error?: string;
}

// ─── STATE ───

let lastCallTime = 0;
let callCountThisMinute = 0;
let minuteStart = Date.now();
let groqCallCountToday = 0;
const MIN_INTERVAL_MS = 1500;
const MAX_CALLS_PER_MINUTE = 15;
const DAILY_LIMIT = 500;
const DRY_RUN = process.env.CRAWL_DRY_RUN === 'true' || process.env.NODE_ENV === 'development';

// ─── HELPERS ───

function loadBudget(): EmbeddingBudget {
  const today = new Date().toISOString().split('T')[0];
  const fallback: EmbeddingBudget = {
    daily_limit: DAILY_LIMIT,
    used_today: 0,
    reset_at: `${today}T23:59:59Z`,
    last_call_ts: 0,
    calls_today: 0,
    errors_today: 0,
    groq_calls_today: 0,
    history: [],
  };
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
      if (saved.reset_at?.split('T')[0] !== today) return fallback;
      return { ...fallback, ...saved, daily_limit: saved.daily_limit || DAILY_LIMIT };
    }
  } catch {}
  return fallback;
}

function saveBudget(b: EmbeddingBudget) {
  try { fs.writeFileSync(USAGE_FILE, JSON.stringify(b, null, 2)); } catch {}
}

function logBudget(entry: BudgetLogEntry) {
  try {
    let logs: BudgetLogEntry[] = [];
    if (fs.existsSync(BUDGET_LOG)) logs = JSON.parse(fs.readFileSync(BUDGET_LOG, 'utf-8'));
    logs.unshift(entry);
    if (logs.length > 200) logs = logs.slice(0, 200);
    fs.writeFileSync(BUDGET_LOG, JSON.stringify(logs, null, 2));
  } catch {}
}

function estimateTokens(body: any): number {
  if (!body) return 0;
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return Math.ceil(text.length / 3);
}

// ─── THROTTLE ───

async function throttle(endpoint: string): Promise<{ allowed: boolean; reason?: string; waitMs?: number }> {
  const budget = loadBudget();

  // Check daily budget
  if (budget.used_today >= budget.daily_limit) {
    return { allowed: false, reason: `Daily embedding budget exhausted (${budget.used_today}/${budget.daily_limit})` };
  }

  // Check rate limit (per minute)
  const now = Date.now();
  if (now - minuteStart > 60000) {
    minuteStart = now;
    callCountThisMinute = 0;
  }

  if (callCountThisMinute >= MAX_CALLS_PER_MINUTE) {
    const waitMs = 60000 - (now - minuteStart) + 500;
    return { allowed: false, reason: `Rate limit: ${MAX_CALLS_PER_MINUTE} calls/min`, waitMs };
  }

  // Check minimum interval
  const sinceLastCall = now - lastCallTime;
  if (sinceLastCall < MIN_INTERVAL_MS) {
    const waitMs = MIN_INTERVAL_MS - sinceLastCall + 100;
    return { allowed: false, reason: `Min interval ${MIN_INTERVAL_MS}ms`, waitMs };
  }

  return { allowed: true };
}

// ─── MODEL ROUTING ───

const GROQ_MODEL = getOptionalEnv('GROQ_MODEL', 'llama-3.1-8b-instant');

function shouldRouteToGroq(taskType?: TaskType): boolean {
  return taskType === 'classify' || taskType === 'metadata';
}

async function callGroq(prompt: string, taskType: TaskType): Promise<DifyClientResponse> {
  const startTime = Date.now();

  if (DRY_RUN) {
    logBudget({ ts: new Date().toISOString(), endpoint: 'groq-chat', method: 'POST', status: 'dry_run', duration_ms: 0 });
    return {
      ok: true, status: 'dry_run',
      data: { id: `dry-groq-${Date.now().toString(36)}`, dry_run: true, choices: [{ message: { content: '[Dry-run Groq response]' } }] },
      tokens: 50, dryRun: true, budgetRemaining: DAILY_LIMIT,
    };
  }

  try {
    const groqApiKey = getRequiredEnv('GROQ_API_KEY');
    groqCallCountToday++;
    lastCallTime = Date.now();
    callCountThisMinute++;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const duration = Date.now() - startTime;

    if (resp.ok) {
      const data = await resp.json();
      const tokens = data.usage?.total_tokens || 50;
      logBudget({ ts: new Date().toISOString(), endpoint: 'groq-chat', method: 'POST', status: 'success', duration_ms: duration, tokens });

      const budget = loadBudget();
      budget.groq_calls_today++;
      budget.calls_today++;
      budget.last_call_ts = Date.now();
      saveBudget(budget);

      return { ok: true, status: 'success', data, tokens, budgetRemaining: budget.daily_limit - budget.used_today };
    } else {
      const errText = await resp.text().catch(() => 'Unknown');
      logBudget({ ts: new Date().toISOString(), endpoint: 'groq-chat', method: 'POST', status: 'error', duration_ms: duration, error: errText.slice(0, 200) });
      return { ok: false, status: 'error', error: `Groq HTTP ${resp.status}: ${errText.slice(0, 200)}` };
    }
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logBudget({ ts: new Date().toISOString(), endpoint: 'groq-chat', method: 'POST', status: 'error', duration_ms: duration, error: err.message?.slice(0, 200) });
    return { ok: false, status: 'error', error: err.message };
  }
}

// ─── PUBLIC API ───

export interface DifyClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface DifyClientResponse {
  ok: boolean;
  status: 'success' | 'error' | 'throttled' | 'dry_run' | 'budget_exceeded';
  data?: any;
  error?: string;
  tokens?: number;
  dryRun?: boolean;
  budgetRemaining?: number;
}

export async function difyRequest(
  endpoint: string,
  options: { method?: string; body?: any; apiKey?: string; timeout?: number; tokens?: number; taskType?: TaskType } = {},
): Promise<DifyClientResponse> {
  const { method = 'GET', body, apiKey, timeout = 30000, tokens: knownTokens, taskType } = options;

  // ─── MODEL ROUTING: Groq for classify/metadata ───
  if (taskType && shouldRouteToGroq(taskType)) {
    const prompt = typeof body?.query === 'string' ? body.query
      : body?.text ? body.text.slice(0, 2000)
      : JSON.stringify(body || {}).slice(0, 2000);
    return callGroq(prompt, taskType);
  }

  const BASE = getOptionalEnv(
    'DIFY_INTERNAL_BASE_URL',
    getOptionalEnv('APP_API_URL', getOptionalEnv('DIFY_BASE_URL', 'https://dify.affexai.tr/v1')),
  );
  const KEY = apiKey || getRequiredEnv('DIFY_API_KEY');
  const url = `${BASE}${endpoint}`;

  const startTime = Date.now();

  // Dry-run mode: simulate success without API call
  if (DRY_RUN && method !== 'GET') {
    const estTokens = knownTokens || estimateTokens(body);
    logBudget({ ts: new Date().toISOString(), endpoint, method, status: 'dry_run', duration_ms: 0, tokens: estTokens });
    return {
      ok: true, status: 'dry_run',
      data: { id: `dry-${Date.now().toString(36)}`, dry_run: true, estimated_tokens: estTokens },
      tokens: estTokens, dryRun: true, budgetRemaining: DAILY_LIMIT,
    };
  }

  // Throttle check
  const throttleResult = await throttle(endpoint);
  if (!throttleResult.allowed) {
    logBudget({ ts: new Date().toISOString(), endpoint, method, status: 'throttled', duration_ms: Date.now() - startTime });
    return { ok: false, status: throttleResult.reason?.includes('budget') ? 'budget_exceeded' : 'throttled', error: throttleResult.reason };
  }

  // ─── CACHE CHECK ───
  const modelName = taskType ? (shouldRouteToGroq(taskType) ? GROQ_MODEL : 'gemini-2.5-flash') : 'gemini-2.5-flash';
  const cacheHash = hashInput(modelName, body || endpoint);
  if (method === 'POST' && taskType) {
    const cached = await getCached(cacheHash);
    if (cached) {
      logBudget({ ts: new Date().toISOString(), endpoint: `${endpoint}(cached)`, method, status: 'success', duration_ms: Date.now() - startTime, tokens: 0 });
      return { ok: true, status: 'success', data: cached, tokens: 0, budgetRemaining: DAILY_LIMIT };
    }
  }

  // Make actual request
  try {
    lastCallTime = Date.now();
    callCountThisMinute++;

    const resp = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        ...(method === 'GET' ? {} : {}),
      },
      ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(timeout),
    });

    const duration = Date.now() - startTime;
    const estTokens = knownTokens || estimateTokens(body);

    if (resp.ok) {
      let data: any = { ok: true };
      try { data = await resp.json(); } catch {}
      logBudget({ ts: new Date().toISOString(), endpoint, method, status: 'success', duration_ms: duration, tokens: estTokens });

      const budget = loadBudget();
      budget.used_today += estTokens;
      budget.calls_today++;
      budget.last_call_ts = Date.now();
      budget.history.push({ ts: new Date().toISOString(), tokens: estTokens, endpoint, status: 'success' });
      if (budget.history.length > 100) budget.history = budget.history.slice(-100);
      saveBudget(budget);

      // ─── CACHE WRITE ───
      if (method === 'POST' && taskType) {
        setCached(cacheHash, data, modelName, taskType).catch(() => {});
      }

      return {
        ok: true, status: 'success', data,
        tokens: estTokens, budgetRemaining: budget.daily_limit - budget.used_today,
      };
    } else {
      const errText = await resp.text().catch(() => 'Unknown');
      logBudget({ ts: new Date().toISOString(), endpoint, method, status: 'error', duration_ms: duration, error: errText.slice(0, 200) });

      const budget = loadBudget();
      budget.errors_today++;
      budget.calls_today++;
      saveBudget(budget);

      return { ok: false, status: 'error', error: `HTTP ${resp.status}: ${errText.slice(0, 200)}`, budgetRemaining: budget.daily_limit - budget.used_today };
    }
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logBudget({ ts: new Date().toISOString(), endpoint, method, status: 'error', duration_ms: duration, error: err.message?.slice(0, 200) });
    return { ok: false, status: 'error', error: err.message };
  }
}

// ─── BUDGET QUERIES ───

export function getBudgetStatus() {
  const budget = loadBudget();
  return {
    daily_limit: budget.daily_limit,
    used_today: budget.used_today,
    remaining: budget.daily_limit - budget.used_today,
    usage_pct: Math.round((budget.used_today / budget.daily_limit) * 100),
    calls_today: budget.calls_today,
    errors_today: budget.errors_today,
    groq_calls_today: budget.groq_calls_today || 0,
    reset_at: budget.reset_at,
    dry_run: DRY_RUN,
    rate_limit: { min_interval_ms: MIN_INTERVAL_MS, max_per_minute: MAX_CALLS_PER_MINUTE },
  };
}

export function getBudgetLogs(limit = 20): BudgetLogEntry[] {
  try {
    if (fs.existsSync(BUDGET_LOG)) {
      const logs = JSON.parse(fs.readFileSync(BUDGET_LOG, 'utf-8'));
      return logs.slice(0, limit);
    }
  } catch {}
  return [];
}

export function resetDailyBudget() {
  const today = new Date().toISOString().split('T')[0];
  const fresh: EmbeddingBudget = {
    daily_limit: DAILY_LIMIT, used_today: 0,
    reset_at: `${today}T23:59:59Z`,
    last_call_ts: 0, calls_today: 0, errors_today: 0, groq_calls_today: 0, history: [],
  };
  saveBudget(fresh);
  lastCallTime = 0; callCountThisMinute = 0; minuteStart = Date.now();
  return getBudgetStatus();
}

// ─── QUICK HEALTH ───

export function healthCheck(): { dryRun: boolean; budget: ReturnType<typeof getBudgetStatus> } {
  return { dryRun: DRY_RUN, budget: getBudgetStatus() };
}

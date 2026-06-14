import { NextResponse } from 'next/server';
import { getBudgetStatus, getBudgetLogs, resetDailyBudget, healthCheck } from '@/lib/dify-client';
import { getQueueStats } from '@/lib/crawl-queue';
import { getCacheStats } from '@/lib/llm-cache';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const budget = getBudgetStatus();
  const health = healthCheck();
  const queue = getQueueStats();
  const logs = getBudgetLogs(10);
  const cache = await getCacheStats();

  return NextResponse.json({
    budget: {
      ...budget,
      groq_calls_today: budget.groq_calls_today || 0,
      model_breakdown: {
        gemini: (budget.calls_today || 0) - (budget.groq_calls_today || 0),
        groq: budget.groq_calls_today || 0,
        cached: cache.hits,
      },
      savings_estimate: Math.round(cache.hits * 0.003 * 100) / 100,
    },
    health,
    queue,
    cache: {
      total: cache.total,
      hits: cache.hits,
      hit_rate: cache.hit_rate,
    },
    recent_logs: logs,
  });
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const fresh = resetDailyBudget();
  return NextResponse.json({ reset: true, budget: fresh });
}

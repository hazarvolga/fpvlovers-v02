import { NextResponse } from 'next/server';
import { getBudgetStatus } from '@/lib/dify-client';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { collectAdminHealth } from '@/lib/server/admin-health';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';

type Alert = {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
};

const BUDGET_WARN_PCT = 90;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [report, published] = await Promise.all([
    collectAdminHealth(),
    listPublishedContentAsync().catch((): null => null),
  ]);

  const alerts: Alert[] = report.services.map((service) => ({
    service: service.name,
    status: service.status === 'up' ? 'healthy' : 'down',
    message: [service.version ? `v${service.version}` : null, service.detail, `${service.latency}ms`]
      .filter(Boolean)
      .join(' · '),
  }));

  const budget = getBudgetStatus();
  alerts.push({
    service: 'embedding-budget',
    status: budget.usage_pct >= BUDGET_WARN_PCT ? 'degraded' : 'healthy',
    message: `used_today=${budget.used_today}, limit=${budget.daily_limit}, reset=${budget.reset_at}`,
  });

  alerts.push({
    service: 'content-pipeline',
    status: published ? 'healthy' : 'down',
    message: published ? `${published.length} published artifacts` : 'Published content could not be read',
  });

  const degraded = alerts.filter((alert) => alert.status !== 'healthy');

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: degraded.length === 0 ? 'healthy' : 'degraded',
    alerts,
    degradedCount: degraded.length,
  });
}

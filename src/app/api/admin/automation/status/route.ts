import { NextResponse } from 'next/server';
import { getAutomationStatusReport } from '@/lib/automation/automation-status';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const report = await getAutomationStatusReport();
    return NextResponse.json(report, {
      status: report.overall === 'critical' ? 503 : 200,
    });
  } catch (error: unknown) {
    console.error('[AutomationStatus] Failed to build automation report:', error);
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        overall: 'critical',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

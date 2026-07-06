import { getAutomationStatusReport } from '../src/lib/automation/automation-status';
import { closePool } from '../src/lib/server/db';

async function main() {
  const targetArg = process.argv.find((arg) => arg.startsWith('--daily-target='));
  const parsedTarget = targetArg ? Number.parseInt(targetArg.split('=')[1] ?? '', 10) : undefined;
  const dailyPublishTarget = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : undefined;

  const report = await getAutomationStatusReport({ dailyPublishTarget });
  console.log(JSON.stringify(report, null, 2));

  if (report.overall === 'critical') {
    process.exitCode = 2;
  } else if (report.overall === 'warning') {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error('[AutomationStatus] Failed:', error);
    process.exitCode = 3;
  })
  .finally(async () => {
    await closePool();
  });

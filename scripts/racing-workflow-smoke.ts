import './load-local-env';
import { getRacingWorkflowStatus, runRacingIntelligenceWorkflow } from '../src/lib/racing-intelligence';

async function main() {
  const status = getRacingWorkflowStatus();

  console.log('\nFPVLovers Racing Intelligence Workflow\n');
  console.log(`Workflow: ${status.workflowName}`);
  console.log(`DSL: ${status.dslPath}`);
  console.log(`Configured: ${status.configured ? 'yes' : 'no'}`);
  console.log(`Token configured: ${status.tokenConfigured ? 'yes' : 'no'}`);

  const result = await runRacingIntelligenceWorkflow({
    mode: 'monitor_extract',
    sourceUrl: 'https://www.multigp.com/races/',
    sourceName: 'MultiGP Races',
    leagueHint: 'MultiGP',
    publishIntent: 'review',
    sourceMarkdown: [
      '# MultiGP Races',
      'Official racing source smoke input for extracting event, league, calendar, pilot, team, track, result, ranking, and media signals.',
      'This smoke test does not claim live race data.',
    ].join('\n\n'),
  });

  console.log(`Run status: ${result.status}`);
  console.log(`Dify success: ${result.success ? 'yes' : 'no'}`);
  console.log(`Fallback used: ${result.status === 'fallback' ? 'yes' : 'no'}`);
  console.log(`Entities: ${result.outputs.entities?.length || 0}`);
  console.log(`Content briefs: ${result.outputs.contentBriefs?.length || 0}`);
  if (result.error) console.log(`Error: ${result.error}`);
  if (result.outputs.nextActions?.length) {
    console.log('\nNext actions:');
    for (const action of result.outputs.nextActions) console.log(`- ${action}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown smoke failure';
  console.error(message);
  process.exit(1);
});

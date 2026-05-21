import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/content-automation/dify-generation';
import { WORKFLOW_IDS, WORKFLOW_TOKENS } from '@/lib/master-routing-tables';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const workflowId = WORKFLOW_IDS[name];
    const workflowToken = WORKFLOW_TOKENS[name];

    if (!workflowId || workflowId.startsWith('TODO-')) {
      return NextResponse.json(
        { success: false, error: `Workflow "${name}" not yet imported to Dify. Import the DSL from dify_workflows/ first.` },
        { status: 501 },
      );
    }

    if (!workflowToken) {
      return NextResponse.json(
        { success: false, error: `No API token configured for workflow "${name}".` },
        { status: 500 },
      );
    }

    const body = await req.json();
    const inputs = body.inputs || {};

    const result = await runWorkflow(workflowToken, inputs);

    return NextResponse.json({
      success: result.success,
      workflowRunId: result.workflowRunId,
      totalTokens: result.totalTokens,
      elapsedTime: result.elapsedTime,
      outputs: result.outputs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

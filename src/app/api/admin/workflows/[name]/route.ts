import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/dify-client';
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
    const inputs = body && typeof body === 'object' && 'inputs' in body && body.inputs && typeof body.inputs === 'object'
      ? body.inputs as Record<string, unknown>
      : {};

    const result = await runWorkflow(workflowId, inputs, workflowToken);

    return NextResponse.json({
      success: result.success,
      workflowRunId: result.workflowRunId,
      totalTokens: result.totalTokens,
      elapsedTime: result.elapsedTime,
      outputs: result.outputs,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown workflow error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

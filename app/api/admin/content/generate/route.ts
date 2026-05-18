import { NextRequest, NextResponse } from 'next/server';
import { generateContentViaDify, normalizeContentGenerationTemplate } from '@/lib/content-automation/dify-generation';

export async function POST(req: NextRequest) {
  try {
    const { topic, template, language = 'tr', tone = 'professional', title, category, brief } = await req.json();
    const normalizedTemplate = normalizeContentGenerationTemplate(template);

    const result = await generateContentViaDify({
      topic,
      template: normalizedTemplate,
      language,
      tone,
      title,
      category,
      brief,
    });

    return NextResponse.json({
      success: result.success,
      template: result.template,
      content: result.content,
      rawAnswer: result.rawAnswer.slice(0, 500),
      sources: result.sources,
      workflowRunId: result.workflowRunId,
      totalTokens: result.totalTokens,
      elapsedTime: result.elapsedTime,
      outputs: result.outputs,
      jobId: undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

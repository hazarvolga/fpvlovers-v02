import { NextRequest, NextResponse } from 'next/server';
import {
  orchestrate, listAllRoutes, listAllDatasets,
} from '@/lib/master-orchestrator';
import { orchestrateRetrieval } from '@/lib/retrieval-orchestrator';
import { composeResponse } from '@/lib/response-composer';
import { generateEcosystemReport } from '@/lib/ecosystem-intelligence';
import { getMasterHealth } from '@/lib/master-health';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'route';
  const q = req.nextUrl.searchParams.get('q') || '';
  const contentType = req.nextUrl.searchParams.get('contentType') || undefined;
  const forceIntent = req.nextUrl.searchParams.get('intent') || undefined;
  const forceApp = req.nextUrl.searchParams.get('app') || undefined;

  switch (action) {
    case 'routes':
      return NextResponse.json({ routes: listAllRoutes() });

    case 'datasets':
      return NextResponse.json({ datasets: listAllDatasets() });

    case 'health':
      return NextResponse.json(getMasterHealth());

    case 'retrieval': {
      if (!q) return NextResponse.json({ error: 'Query required (?q=...)' }, { status: 400 });
      const intent = forceIntent || 'default';
      const result = await orchestrateRetrieval(q, intent);
      return NextResponse.json(result);
    }

    case 'compose': {
      if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
      const masterResult = orchestrate({ query: q, contentType, forceIntent, forceApp });
      const retrievalResult = await orchestrateRetrieval(q, masterResult.routing.intent);
      const composed = await composeResponse(masterResult, q, retrievalResult);
      return NextResponse.json(composed);
    }

    case 'intelligence': {
      const report = generateEcosystemReport(q || undefined, forceIntent);
      return NextResponse.json(report);
    }

    case 'route':
    default: {
      if (!q) return NextResponse.json({ error: 'Query required (?q=...)' }, { status: 400 });
      const result = orchestrate({ query: q, contentType, forceIntent, forceApp });
      return NextResponse.json(result);
    }
  }
}

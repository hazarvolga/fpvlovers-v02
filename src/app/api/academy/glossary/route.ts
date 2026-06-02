import { NextRequest, NextResponse } from 'next/server';
import { searchTerms, getLiveRAGInsights, getTermBySlug } from '@/lib/server/glossary';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';
    const difficulty = searchParams.get('difficulty') || 'all';
    const enrichSlug = searchParams.get('enrich') || '';

    // If requesting specific RAG enrichment for a detailed card view
    if (enrichSlug) {
      const term = getTermBySlug(enrichSlug);
      if (!term) {
        return NextResponse.json({ error: 'Term not found' }, { status: 404 });
      }

      const ragTelemetry = await getLiveRAGInsights(term.term);
      return NextResponse.json({
        term,
        ragTelemetry,
      });
    }

    // Default: return filtered list of terms
    const terms = searchTerms(query, category, difficulty);

    return NextResponse.json({
      success: true,
      count: terms.length,
      terms,
    });
  } catch (err) {
    console.error('[Glossary API] Request failed:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve aerospace telemetry terms' },
      { status: 500 }
    );
  }
}

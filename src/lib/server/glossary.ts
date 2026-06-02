import fs from 'fs';
import path from 'path';
import { orchestrateRetrieval } from '@/lib/retrieval-orchestrator';

export interface GlossaryTerm {
  term: string;
  slug: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Start Here' | 'Radio Control System' | 'Power System' | 'Flight Control System' | 'Video System' | 'Navigation System' | 'Flight Physics' | 'Troubleshooting';
  definition: string;
  plainLanguageExplanation: string;
  whyItMatters: string;
  relatedAcademyModules: string[];
  relatedMissionProfiles: string[];
  relatedBuildDNA: string[];
  relatedArticles: string[];
  relatedTutorials: string[];
  relatedTools: string[];
  relatedTroubleshooting: string[];
  relatedTerms: string[];
  seoKeywords: string[];
  priority: 'P0' | 'P1' | 'P2';
}

export interface RAGInsight {
  content: string;
  source: string;
  score: number;
}

const GLOSSARY_FILE = path.join(process.cwd(), 'data', 'glossary.json');

// Cache the loaded glossary terms in memory for performance
let cachedTerms: GlossaryTerm[] | null = null;

function loadGlossaryTerms(): GlossaryTerm[] {
  if (cachedTerms) return cachedTerms;

  try {
    if (fs.existsSync(GLOSSARY_FILE)) {
      const rawData = fs.readFileSync(GLOSSARY_FILE, 'utf-8');
      cachedTerms = JSON.parse(rawData) as GlossaryTerm[];
      return cachedTerms;
    }
  } catch (err) {
    console.error('[Glossary] Error reading glossary seed file:', err);
  }

  return [];
}

export function getAllTerms(): GlossaryTerm[] {
  return loadGlossaryTerms();
}

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  const terms = loadGlossaryTerms();
  return terms.find(t => t.slug === slug);
}

export function getTermsByCategory(category: string): GlossaryTerm[] {
  const terms = loadGlossaryTerms();
  return terms.filter(t => t.category.toLowerCase() === category.toLowerCase());
}

export function searchTerms(queryText: string, category?: string, difficulty?: string): GlossaryTerm[] {
  let terms = loadGlossaryTerms();

  if (category && category !== 'all') {
    terms = terms.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  if (difficulty && difficulty !== 'all') {
    terms = terms.filter(t => t.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  if (!queryText) return terms;

  const normalizedQuery = queryText.toLowerCase().trim();
  return terms.filter(t => 
    t.term.toLowerCase().includes(normalizedQuery) ||
    t.definition.toLowerCase().includes(normalizedQuery) ||
    t.plainLanguageExplanation.toLowerCase().includes(normalizedQuery) ||
    t.seoKeywords.some(kw => kw.toLowerCase().includes(normalizedQuery))
  );
}

/**
 * Dynamically enriches a glossary term with live insights retrieved from Dify RAG.
 */
export async function getLiveRAGInsights(term: string): Promise<{
  insights: RAGInsight[];
  confidence: number;
  grade: string;
  recommendation: string;
}> {
  try {
    // Map term queries to standard FPV intents
    let intent = 'default';
    const lowerTerm = term.toLowerCase();
    if (lowerTerm.includes('pid') || lowerTerm.includes('tune') || lowerTerm.includes('filter')) {
      intent = 'tuning';
    } else if (lowerTerm.includes('motor') || lowerTerm.includes('esc') || lowerTerm.includes('fc')) {
      intent = 'parts';
    } else if (lowerTerm.includes('failsafe') || lowerTerm.includes('desync') || lowerTerm.includes('breakup')) {
      intent = 'troubleshooting';
    } else if (lowerTerm.includes('gps') || lowerTerm.includes('rescue')) {
      intent = 'regulations'; // Or navigation if separate, here we use default retrieval intents
    }

    // Call our retrieval-orchestrator to fetch matching documentation from 9 Dify datasets
    const retrievalResult = orchestrateRetrieval(term, intent, { topK: 3 });

    const insights: RAGInsight[] = retrievalResult.chunks.map(chunk => ({
      content: chunk.content,
      source: chunk.documentName || chunk.datasetName,
      score: chunk.score,
    }));

    const avgScore = retrievalResult.stats.averageScore;
    let grade = 'low';
    let recommendation = 'Fallback to high-fidelity offline system repository.';

    if (avgScore >= 0.75) {
      grade = 'high';
      recommendation = 'Telemetry link strong. Live telemetry active.';
    } else if (avgScore >= 0.55) {
      grade = 'medium';
      recommendation = 'Link established. Technical consensus fetched.';
    }

    return {
      insights,
      confidence: retrievalResult.stats.confidence,
      grade,
      recommendation,
    };
  } catch (err) {
    console.error('[Glossary RAG] Dynamic retrieval failed, fallback active:', err);
    return {
      insights: [],
      confidence: 0,
      grade: 'insufficient',
      recommendation: 'Satellite telemetry lost. Offline high-fidelity database engaged.',
    };
  }
}

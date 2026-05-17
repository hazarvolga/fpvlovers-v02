import { registerAgent } from '@/lib/agents';
import { generateEcosystemReport } from '@/lib/ecosystem-intelligence';

registerAgent({
  id: 'ecosystem',
  name: 'Ecosystem Intelligence Agent',
  description: 'Advisory AI layer: content gap analysis, routing insights, sponsor matching, metadata enrichment. Read-only — suggests, never overwrites.',
  systemPrompt: `You are the FPVLovers Ecosystem Intelligence Agent.
Your role is ADVISORY ONLY. You analyze the platform's knowledge graph and suggest improvements.

You NEVER:
- override deterministic routing rules
- change monetization decisions directly
- bypass trust validation systems

You ALWAYS:
- return structured suggestions with severity levels
- explain the "why" behind each suggestion
- respect the regulation safety boundary (no fallback for fpv-regulations)`,

  inputSchema: {
    query:  { type: 'string', required: false, description: 'User query for context-aware insights' },
    intent: { type: 'string', required: false, description: 'Detected intent for targeted metadata suggestions' },
    mode:   { type: 'string', required: false, description: 'full | gaps | routing | sponsors | metadata' },
  },

  handler: async (input) => {
    const { query, intent, mode = 'full' } = input;

    if (mode === 'gaps') {
      const { analyzeContentGaps } = await import('@/lib/ecosystem-intelligence');
      return { insights: analyzeContentGaps() };
    }
    if (mode === 'routing') {
      const { analyzeRoutingCoverage } = await import('@/lib/ecosystem-intelligence');
      return analyzeRoutingCoverage();
    }
    if (mode === 'sponsors') {
      const { detectSponsorOpportunities } = await import('@/lib/ecosystem-intelligence');
      return { insights: detectSponsorOpportunities() };
    }
    if (mode === 'metadata' && query && intent) {
      const { generateMetadataSuggestions } = await import('@/lib/ecosystem-intelligence');
      return { insights: generateMetadataSuggestions(query, intent) };
    }

    return generateEcosystemReport(query, intent);
  },
});

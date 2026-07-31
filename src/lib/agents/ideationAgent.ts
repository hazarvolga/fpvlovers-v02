// Ideation Agent — Generates structured FPV content briefs grounded in RAG data
import { registerAgent } from '@/lib/agents';
import { difyRequest } from '@/lib/dify-client';
import { orchestrateRetrieval } from '@/lib/retrieval-orchestrator';

const extractJsonArray = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1).trim();
  }

  return null;
};

registerAgent({
  id: 'ideation',
  name: 'Ideation Agent',
  description: 'Generates structured FPV content briefs grounded in RAG data to keep the content pipeline active.',
  systemPrompt: `You are the FPV Content Ideation Agent for fpvlovers.com.tr.
Your role is to analyze current FPV trends, community issues, and news, and generate high-value, SEO-optimized content ideas (briefs).
You must output a raw JSON array of content briefs and nothing else. No explanation, no markdown wraps.`,

  inputSchema: {
    existingSlugs: { type: 'array', required: false, description: 'List of slugs that have already been generated to avoid duplicates' },
    count: { type: 'number', required: false, description: 'Number of briefs to generate (default: 10)' },
  },

  handler: async (input) => {
    const existingSlugs = Array.isArray(input.existingSlugs)
      ? input.existingSlugs.filter((slug): slug is string => typeof slug === 'string')
      : [];
    const count = typeof input.count === 'number' && Number.isFinite(input.count)
      ? Math.max(1, Math.min(25, Math.floor(input.count)))
      : 10;

    // 1. Gather FPV community context from RAG datasets
    let contextChunks: string[] = [];
    try {
      const queries = [
        'latest fpv drone news new product release walksnail dji hdzero betaflight',
        'common fpv drone troubleshooting binding arming video problems',
        'fpv drone build guide component compatibility motors flight controller esc'
      ];

      for (const q of queries) {
        const res = await orchestrateRetrieval(q, 'default');
        if (res?.chunks) {
          contextChunks.push(...res.chunks.slice(0, 3).map(c => `[Dataset: ${c.datasetName}] ${c.content}`));
        }
      }
    } catch (err) {
      console.warn('[IdeationAgent] Failed to fetch RAG context:', err);
    }

    const contextText = contextChunks.length > 0
      ? contextChunks.join('\n\n')
      : 'No real-time RAG context available. Fall back to emerging 2026 FPV drone technology (DJI O4, ELRS Gemini, 10-inch long-range, Walksnail Moonlight, etc.)';

    // 2. Prepare Prompt
    const prompt = `You are the FPV Content Ideation Agent for fpvlovers.com.tr.
Generate exactly ${count} new, high-quality, unique content briefs for FPV drone pilots.
These ideas will feed into an automated content generator, so they must be technically precise and valuable.

CRITICAL CRITERIA:
1. Do NOT suggest anything similar to these already-existing slugs:
${existingSlugs.map((s) => `- ${s}`).join('\n')}

2. Categories we support:
- Flight Guides
- Troubleshooting
- Build Guides
- Components
- News and Reviews

3. Content Templates we support:
- tech-article (tutorials, guides)
- product-review (single product reviews)
- build-guide (part lists and builds)
- comparison (spec face-offs, "X vs Y")
- troubleshooting (fixing specific issues)
- regulation-guide (legal rules, battery safety)
- community-roundup (weekly highlights)

4. Context from FPV community & datasets:
${contextText}

5. sourceHints MUST contain real editorial FPV website URLs (not outline points). These are used by the image harvester to find photos from our crawled database. Use this mapping based on the article's category:
- Flight Guides      → ["https://oscarliang.com/", "https://www.rotorriot.com/"]
- Build Guides       → ["https://oscarliang.com/", "https://www.fpvknowitall.com/"]
- Troubleshooting    → ["https://oscarliang.com/", "https://www.rotorriot.com/"]
- Components         → ["https://oscarliang.com/", "https://pyrodrone.com/"]
- News and Reviews   → ["https://www.rotorriot.com/", "https://oscarliang.com/"]
Always include the 2 category URLs, then add the article's primary keyword and 1-2 key sub-topics as plain strings for semantic matching.

Output MUST be a raw JSON array of briefs. Do not include markdown code block fences (no \`\`\`json). Just return the array.
Each brief object in the array MUST strictly follow this TypeScript structure:
{
  "briefSlug": "unique-kebab-case-slug-for-article",
  "title": "Compelling, SEO-Optimized Title (strictly in English)",
  "category": "Flight Guides | Troubleshooting | Build Guides | Components | News and Reviews",
  "template": "tech-article | product-review | build-guide | comparison | troubleshooting | regulation-guide | community-roundup",
  "topic": "A detailed 2-3 sentence description of what the article will cover and target audience",
  "sourceHints": ["https://oscarliang.com/", "https://www.rotorriot.com/", "primary keyword for this article"],
  "seo": {
    "slug": "unique-kebab-case-slug-for-article",
    "metaDescription": "An SEO-friendly meta description under 150 characters with a CTA",
    "keywords": ["primary target keyword", "related keyword 1", "related keyword 2"]
  }
}`;

    // 3. Make Dify API Call (routed via difyRequest)
    // We use the FPV Expert Assistant chat endpoint to generate this structure.
    const token = process.env.DIFY_APP_TOKEN_EXPERT;
    if (!token) {
      throw new Error('DIFY_APP_TOKEN_EXPERT environment variable is not configured');
    }

    const response = await difyRequest('/chat-messages', {
      method: 'POST',
      apiKey: token,
      taskType: 'ideation',
      body: {
        query: prompt,
        response_mode: 'blocking',
        user: 'system-ideation-agent',
        inputs: { intent: 'research' }
      }
    });

    if (!response.ok) {
      throw new Error(`Dify API call failed: ${response.error || response.status}`);
    }

    let answer = '';
    if (response.data) {
      if (response.data.choices?.[0]?.message?.content) {
        answer = response.data.choices[0].message.content;
      } else {
        answer = response.data.answer || '';
      }
    }

    const jsonText = extractJsonArray(answer);
    if (!jsonText) {
      console.error('[IdeationAgent] LLM answer did not contain JSON array:', answer);
      throw new Error('LLM output could not be parsed as a JSON array');
    }

    try {
      const briefs = JSON.parse(jsonText);
      if (!Array.isArray(briefs)) {
        throw new Error('Parsed output is not an array');
      }
      return { briefs };
    } catch (err) {
      console.error('[IdeationAgent] Failed to parse JSON block:', jsonText);
      throw new Error('Failed to parse clean JSON array from LLM output');
    }
  }
});

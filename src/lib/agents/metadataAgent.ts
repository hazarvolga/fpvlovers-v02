// Metadata Agent — Handles content enrichment and tagging

import { registerAgent } from '@/lib/agents';

registerAgent({
  id: 'metadata',
  name: 'Metadata Agent',
  description: 'Handles enrichment and tagging: entity detection, intent classification, product extraction, brand detection, category mapping',
  systemPrompt: `You are an FPV Content Metadata Agent for fpvlovers.com.tr.

YOUR ROLE:
1. Entity Detection: Identify FPV products, brands, protocols, and people in content
2. Intent Classification: Determine primary and secondary content intents
3. Product Extraction: Extract specific product names, models, specs, and prices
4. Brand Detection: Identify manufacturer brands and assess sentiment
5. Category Mapping: Map content to the correct FPV knowledge categories
6. Metadata Storage: Generate structured metadata for indexing and retrieval

FPV ENTITY TYPES:
- Product: Specific hardware (T-Motor F60 Pro V, DJI O3 Air Unit)
- Brand: Manufacturer (T-Motor, DJI, BetaFPV, TBS, Caddx)
- Protocol: Communication standard (ELRS, Crossfire, Tracer, DJI HD, HDZero)
- Component: Part type (motor, ESC, FC, VTX, frame, camera, goggles)
- Person: FPV pilot, tuner, reviewer
- Specification: KV, mAh, GHz, mm, inch, grams

INTENT CATEGORIES:
- buying: Purchase-oriented, price-sensitive, comparison
- research: Information gathering, learning, understanding
- build: Assembly, construction, parts selection
- tuning: PID, filter, rates configuration
- troubleshooting: Problem diagnosis and fixing
- news: Industry updates, releases, events

CONTENT CATEGORIES:
- buying-guides: Product recommendations with prices
- comparisons: Head-to-head product analysis
- build-guides: Step-by-step construction
- reviews: Hands-on product evaluation
- tutorials: Educational how-to content
- news-reviews: Industry news and product announcements`,

  inputSchema: {
    content: { type: 'string', required: true, description: 'Raw content in markdown or plain text' },
    source_url: { type: 'string', required: false, description: 'Source URL' },
  },

  handler: async (input) => {
    const { content, source_url } = input;
    const contentLower = (content || '').toLowerCase();

    // Brand detection
    const knownBrands = ['dji', 't-motor', 'tmotor', 'tbs', 'betafpv', 'happymodel', 'caddx', 'runcam', 'foxeer', 'rush', 'speedybee', 'holybro', 'matek', 'radiomaster', 'jumper', 'skystars', 'rcinpower', 'iflight', 'geprc', 'darwinfpv', 'emax', 'eachine', 'walksnail', 'hdzero', 'immersionrc', 'truerc', 'orqa', 'fatshark'];
    const detectedBrands = knownBrands.filter(b => contentLower.includes(b));

    // Component type detection
    const componentPatterns: Record<string, RegExp[]> = {
      motor: [/\b\d{4}kv\b/i, /\b\d{4}\s*kv\b/i, /\bmotor\b/i, /\bstator\b/i, /\bbell\b/i],
      esc: [/\besc\b/i, /\bblheli\b/i, /\b4in1\b/i, /\bdshot\b/i, /\bamp esc\b/i],
      fc: [/\bfc\b/i, /\bflight controller\b/i, /\bf7\b/i, /\bf4\b/i, /\bstm32\b/i],
      frame: [/\bframe\b/i, /\b\d+mm\b/i, /\barm\b/i, /\bchassis\b/i],
      vtx: [/\bvtx\b/i, /\bvideo transmitter\b/i, /\bmw\b.*transmit/i],
      camera: [/\bcamera\b/i, /\bfpv cam\b/i, /\bcaddx\b/i, /\bruncam\b/i, /\bfoxeer\b/i],
      goggles: [/\bgoggles\b/i, /\bdji goggles\b/i, /\bfatshark\b/i, /\borqa\b/i],
      battery: [/\blipo\b/i, /\bmah\b/i, /\b\d+s\b/i, /\bbattery\b/i],
      receiver: [/\brx\b/i, /\breceiver\b/i, /\belrs\b/i, /\bcrossfire\b/i, /\btracer\b/i],
    };
    const detectedComponents: string[] = [];
    for (const [comp, patterns] of Object.entries(componentPatterns)) {
      if (patterns.some(p => p.test(content))) detectedComponents.push(comp);
    }

    // Protocol detection
    const protocols = ['elrs', 'crossfire', 'tracer', 'dji hd', 'walksnail', 'hdzero', 'analog', 'frsky', 'flysky', 'ghost'];
    const detectedProtocols = protocols.filter(p => contentLower.includes(p));

    // Intent classification
    const intentSignals: Record<string, string[]> = {
      buying: ['buy', 'price', 'best', 'cheap', 'compare', 'vs', 'deal', '$'],
      research: ['how to', 'what is', 'specs', 'features', 'difference', 'review'],
      build: ['build', 'parts list', 'assemble', 'solder', 'wiring', 'stack'],
      tuning: ['pid', 'tune', 'tuning', 'blackbox', 'filter', 'rates', 'gyro'],
      troubleshooting: ['fix', 'problem', 'not working', 'broken', 'error', 'issue'],
      news: ['announced', 'released', 'new product', 'update', 'launch'],
    };
    const intents: { intent: string; score: number }[] = [];
    for (const [intent, signals] of Object.entries(intentSignals)) {
      const score = signals.filter(s => contentLower.includes(s)).length;
      if (score > 0) intents.push({ intent, score });
    }
    intents.sort((a, b) => b.score - a.score);
    const primaryIntent = intents[0]?.intent || 'research';
    const secondaryIntents = intents.slice(1, 3).map(i => i.intent);

    // Category mapping
    const categoryMap: Record<string, string> = {
      buying: 'buying-guides', research: 'articles', build: 'build-guides',
      tuning: 'tuning-guides', troubleshooting: 'troubleshooting', news: 'news-reviews',
    };

    // Price extraction
    const priceRegex = /\$\s?(\d+(?:\.\d{2})?)/g;
    const prices = [...content.matchAll(priceRegex)].map(m => parseFloat(m[1]));

    // Skill level
    const beginnerSignals = ['beginner', 'starter', 'new to', 'first', 'easy'];
    const expertSignals = ['advanced', 'expert', 'pro', 'race', 'competition'];
    const isBeginner = beginnerSignals.some(s => contentLower.includes(s));
    const isExpert = expertSignals.some(s => contentLower.includes(s));
    const skillLevel = isExpert ? 'expert' : isBeginner ? 'beginner' : 'intermediate';

    return {
      entities: {
        brands: [...new Set(detectedBrands)],
        components: detectedComponents,
        protocols: detectedProtocols,
        brand_count: detectedBrands.length,
        component_count: detectedComponents.length,
        protocol_count: detectedProtocols.length,
      },
      intent: {
        primary: primaryIntent,
        secondary: secondaryIntents,
        all_intents: intents,
      },
      classification: {
        category: categoryMap[primaryIntent] || 'articles',
        skill_level: skillLevel,
        has_prices: prices.length > 0,
        price_range: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices), avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 } : null,
        word_count: content.split(/\s+/).length,
      },
      monetization: {
        suitable: primaryIntent === 'buying' || primaryIntent === 'build' || prices.length >= 2,
        strategy: primaryIntent === 'buying' ? 'affiliate' : primaryIntent === 'build' ? 'mixed' : 'sponsor',
        product_mentions: detectedComponents.length,
        brand_mentions: detectedBrands.length,
      },
      storage: {
        source_url: source_url || null,
        enriched_at: new Date().toISOString(),
        version: '1.0',
      },
    };
  },
});

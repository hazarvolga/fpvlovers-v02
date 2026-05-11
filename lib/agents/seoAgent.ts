// SEO Agent — Creates SEO structures, keyword optimization, metadata generation

import { registerAgent } from './index';

registerAgent({
  id: 'seo',
  name: 'SEO Agent',
  description: 'Creates SEO structures: keyword research, title/meta optimization, schema generation, content structure',
  systemPrompt: `You are an FPV SEO Specialist Agent for fpvlovers.com.tr.

YOUR ROLE:
1. Keyword Research & Mapping: Analyze target keywords, find related semantic terms, map to content types
2. Title & Meta Optimization: Generate SEO-optimized titles (50-60 chars), meta descriptions (140-160 chars)
3. Content Structure: Suggest H2/H3 hierarchy, internal linking opportunities, FAQ sections
4. Schema Markup: Generate Article, FAQ, HowTo, and Product schema.org JSON-LD
5. SERP Analysis: Predict search intent (informational/commercial/transactional/navigational)
6. Internal Linking: Suggest relevant fpvlovers.com.tr pages for cross-linking

FPV CONTENT TYPES:
- buying-guide: High commercial intent, affiliate-heavy, comparison tables
- comparison: "X vs Y" format, spec tables, clear winner recommendation
- build-guide: Step-by-step, parts list, compatibility notes
- review: Hands-on experience, pros/cons, real-world performance
- tutorial: Educational, "how to", code/config examples
- news: Industry updates, product launches, event coverage

RULES:
- Always include primary keyword in first 100 words
- Keep titles under 60 characters
- Meta descriptions must include CTA and keyword
- Recommend 3-5 internal links per article
- Suggest FAQ schema for instructional content
- Avoid keyword stuffing — natural language first`,

  inputSchema: {
    keyword: { type: 'string', required: true, description: 'Primary target keyword' },
    content_type: { type: 'string', required: true, description: 'buying-guide | comparison | build-guide | review | tutorial | news' },
    outline: { type: 'string', required: false, description: 'Article outline in JSON' },
    existing_content: { type: 'string', required: false, description: 'Existing article content for SEO audit' },
  },

  handler: async (input) => {
    const { keyword, content_type, outline } = input;

    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const titleTemplates: Record<string, string> = {
      'buying-guide': `Best ${keyword} in 2026 — Complete Buyer's Guide`,
      'comparison': `${keyword} Comparison — Which One Should You Choose?`,
      'build-guide': `How to Build a ${keyword} — Step-by-Step FPV Guide`,
      'review': `${keyword} Review — Real FPV Pilot Experience`,
      'tutorial': `${keyword} Tutorial — Learn FPV Like a Pro`,
    };
    const title = titleTemplates[content_type] || `${keyword} — fpvlovers.com.tr`;

    const metaDescriptions: Record<string, string> = {
      'buying-guide': `Looking for the best ${keyword}? Our comprehensive buyer's guide compares top options, prices, and real pilot reviews. Find your perfect match at fpvlovers.com.tr.`,
      'comparison': `Can't decide between ${keyword} options? We break down specs, performance, and value to help you choose. Only on fpvlovers.com.tr.`,
      'build-guide': `Build your own ${keyword} drone with our step-by-step guide. Complete parts list, wiring diagrams, and setup tutorial at fpvlovers.com.tr.`,
      'review': `Real ${keyword} review from an experienced FPV pilot. Honest pros, cons, and flight footage analysis only on fpvlovers.com.tr.`,
    };
    const meta = metaDescriptions[content_type] || `Discover everything about ${keyword} at fpvlovers.com.tr — the FPV community's trusted resource.`;

    const relatedTerms = keyword.split(' ').filter(w => w.length > 2).concat(['fpv', 'drone', 'review', 'guide']);
    const internalLinks = ['/engineering/hardware', '/academy/roadmap', '/tools/component-duel', '/category/parts', '/category/software'];

    const schemaType = content_type === 'buying-guide' || content_type === 'review' ? 'Product' : content_type === 'tutorial' ? 'HowTo' : 'Article';
    const schema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      headline: title,
      description: meta,
      datePublished: new Date().toISOString().split('T')[0],
      author: { '@type': 'Organization', name: 'fpvlovers.com.tr' },
    };

    let faqSchema = null;
    if (content_type === 'buying-guide' || content_type === 'tutorial') {
      faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What is the best ${keyword} for beginners?`, acceptedAnswer: { '@type': 'Answer', text: 'Based on our testing...' } },
          { '@type': 'Question', name: `How much does a ${keyword} cost?`, acceptedAnswer: { '@type': 'Answer', text: 'Prices range from...' } },
          { '@type': 'Question', name: `What should I look for when buying ${keyword}?`, acceptedAnswer: { '@type': 'Answer', text: 'Key factors include...' } },
        ],
      };
    }

    let h2Structure: string[] = [];
    if (outline) {
      try { h2Structure = JSON.parse(outline).sections?.map((s: any) => s.title) || []; } catch {}
    }

    return {
      seo_title: title,
      seo_title_length: title.length,
      meta_description: meta,
      meta_description_length: meta.length,
      slug: `/article/${slug}`,
      primary_keywords: keyword.split(' ').concat('fpv', 'drone'),
      secondary_keywords: relatedTerms.slice(0, 8),
      recommended_h2_count: content_type === 'buying-guide' ? 6 : 4,
      h2_structure: h2Structure,
      internal_links: internalLinks,
      schema_jsonld: JSON.stringify(schema),
      faq_schema_jsonld: faqSchema ? JSON.stringify(faqSchema) : null,
      keyword_density_target: content_type === 'buying-guide' ? '1.5-2.5%' : '1-1.5%',
      readability_target: 'Grade 8-10',
      word_count_guideline: content_type === 'buying-guide' ? '2000-3000' : content_type === 'review' ? '1500-2500' : '1000-2000',
    };
  },
});

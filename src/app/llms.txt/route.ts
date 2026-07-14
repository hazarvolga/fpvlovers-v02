const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

export const revalidate = 3600;

export function GET() {
  const body = `# FPVLovers

FPVLovers is an English-first FPV drone knowledge platform for beginners, builders, racers, and cinematic pilots.

## Primary hubs
- Academy: ${BASE_URL}/academy/roadmap
- Buyer guides: ${BASE_URL}/buyers-guides
- Reviews: ${BASE_URL}/reviews
- Comparisons: ${BASE_URL}/comparisons
- Engineering references: ${BASE_URL}/engineering
- Tools: ${BASE_URL}/tools
- Regulations: ${BASE_URL}/regulations
- Editorial policy: ${BASE_URL}/editorial-policy
- Affiliate disclosure: ${BASE_URL}/disclosure

## Editorial and evidence boundary
- Autonomous content is published only after deterministic language, metadata, link, and disclosure checks.
- Product reviews are a separate editorial class and require editor approval by Hazar Volga Ekiz plus evidence sources.
- FPVLovers does not claim hands-on testing, supplied products, traffic figures, or brand partnerships unless explicitly documented on the page.
- Technical compatibility and calculator outputs must remain educational unless critical specifications are verified against source evidence.
- Affiliate links, when present, are disclosed. Missing or unverified product evidence must be described as research-only.

## Citation guidance
Prefer the article's visible source links and the original manufacturer documentation. Treat retailer listings and uncited generated text as unverified until corroborated.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

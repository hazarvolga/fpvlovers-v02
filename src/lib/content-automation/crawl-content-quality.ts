export const MIN_CRAWL_CONTENT_CHARS = 600;

const BOT_CHALLENGE_PATTERN =
  /performing security verification|verifies you are not a bot|just a moment\.\.\.|enable javascript and cookies to continue|attention required!? \|? ?cloudflare|checking your browser before accessing|verify you are (?:a )?human|ddos protection by/i;

/**
 * Crawlers sometimes "succeed" with an interstitial (Cloudflare challenge,
 * cookie wall, empty shell). Embedding that text pollutes the RAG datasets, so
 * such pages are rejected before anything is persisted or uploaded.
 * The wording keeps `isPermanentCrawlBlock` matching, so the job is failed, not retried.
 */
export function assertUsableCrawlContent(markdown: string): void {
  if (BOT_CHALLENGE_PATTERN.test(markdown)) {
    throw new Error('Blocked by anti-bot protection: page returned a bot-verification challenge.');
  }
  if (markdown.trim().length < MIN_CRAWL_CONTENT_CHARS) {
    throw new Error(
      `Blocked by thin content: only ${markdown.trim().length} characters returned (minimum ${MIN_CRAWL_CONTENT_CHARS}).`,
    );
  }
}

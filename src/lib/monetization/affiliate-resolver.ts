export type AffiliateProvider =
  | 'Amazon'
  | 'AliExpress'
  | 'Banggood'
  | 'DJI'
  | 'GetFPV'
  | 'RaceDayQuads'
  | 'SpeedyBee'
  | 'RadioMaster'
  | 'BetaFPV'
  | 'GEPRC'
  | 'Flywoo';

interface ProviderConfig {
  envKey: string;
  defaultTag: string;
  trackingParams: string[];
  searchUrlTemplate: (query: string, tag: string) => string;
}

const PROVIDER_CONFIGS: Record<AffiliateProvider, ProviderConfig> = {
  Amazon: {
    envKey: 'AFFILIATE_AMAZON_TAG',
    defaultTag: 'fpvlovers-20',
    trackingParams: ['tag'],
    searchUrlTemplate: (query, tag) => query 
      ? `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}`
      : `https://www.amazon.com/?tag=${encodeURIComponent(tag)}`,
  },
  Banggood: {
    envKey: 'AFFILIATE_BANGGOOD_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['p'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.banggood.com/search/${encodeURIComponent(query)}.html?p=${encodeURIComponent(tag)}`
      : `https://www.banggood.com/?p=${encodeURIComponent(tag)}`,
  },
  AliExpress: {
    envKey: 'AFFILIATE_ALIEXPRESS_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.aliexpress.com/w/wholesale.html?SearchText=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}`
      : `https://www.aliexpress.com/?ref=${encodeURIComponent(tag)}`,
  },
  DJI: {
    envKey: 'AFFILIATE_DJI_MEMBER',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'member', 'member_id'],
    searchUrlTemplate: (query, tag) => query
      ? `https://store.dji.com/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&member=${encodeURIComponent(tag)}`
      : `https://store.dji.com/?ref=${encodeURIComponent(tag)}&member=${encodeURIComponent(tag)}`,
  },
  GetFPV: {
    envKey: 'AFFILIATE_GETFPV_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.getfpv.com/catalogsearch/result/?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}`
      : `https://www.getfpv.com/?ref=${encodeURIComponent(tag)}`,
  },
  RaceDayQuads: {
    envKey: 'AFFILIATE_RDQ_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.racedayquads.com/search?type=product&q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://www.racedayquads.com/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
  SpeedyBee: {
    envKey: 'AFFILIATE_SPEEDYBEE_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.speedybee.com/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://www.speedybee.com/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
  RadioMaster: {
    envKey: 'AFFILIATE_RADIOMASTER_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://www.radiomasterrc.com/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://www.radiomasterrc.com/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
  BetaFPV: {
    envKey: 'AFFILIATE_BETAFPV_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://betafpv.com/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://betafpv.com/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
  GEPRC: {
    envKey: 'AFFILIATE_GEPRC_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://geprc.com/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://geprc.com/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
  Flywoo: {
    envKey: 'AFFILIATE_FLYWOO_TAG',
    defaultTag: 'fpvlovers',
    trackingParams: ['ref', 'aff'],
    searchUrlTemplate: (query, tag) => query
      ? `https://flywoo.net/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`
      : `https://flywoo.net/?ref=${encodeURIComponent(tag)}&aff=${encodeURIComponent(tag)}`,
  },
};

/**
 * Normalizes input provider string to match a supported AffiliateProvider key.
 */
function findProvider(providerStr: string): { key: AffiliateProvider; config: ProviderConfig } | null {
  const normalized = providerStr.trim().toLowerCase();
  for (const [key, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (key.toLowerCase() === normalized) {
      return { key: key as AffiliateProvider, config };
    }
  }
  return null;
}

/**
 * Detects affiliate provider based on URL hostname.
 */
function detectProviderFromUrl(url: URL): { key: AffiliateProvider; config: ProviderConfig } | null {
  const host = url.hostname.toLowerCase();
  if (host.includes('amazon.')) return { key: 'Amazon', config: PROVIDER_CONFIGS.Amazon };
  if (host.includes('banggood.')) return { key: 'Banggood', config: PROVIDER_CONFIGS.Banggood };
  if (host.includes('aliexpress.')) return { key: 'AliExpress', config: PROVIDER_CONFIGS.AliExpress };
  if (host.includes('dji.')) return { key: 'DJI', config: PROVIDER_CONFIGS.DJI };
  if (host.includes('getfpv.')) return { key: 'GetFPV', config: PROVIDER_CONFIGS.GetFPV };
  if (host.includes('racedayquads.')) return { key: 'RaceDayQuads', config: PROVIDER_CONFIGS.RaceDayQuads };
  if (host.includes('speedybee.')) return { key: 'SpeedyBee', config: PROVIDER_CONFIGS.SpeedyBee };
  if (host.includes('radiomasterrc.')) return { key: 'RadioMaster', config: PROVIDER_CONFIGS.RadioMaster };
  if (host.includes('betafpv.')) return { key: 'BetaFPV', config: PROVIDER_CONFIGS.BetaFPV };
  if (host.includes('geprc.')) return { key: 'GEPRC', config: PROVIDER_CONFIGS.GEPRC };
  if (host.includes('flywoo.')) return { key: 'Flywoo', config: PROVIDER_CONFIGS.Flywoo };
  return null;
}

/**
 * Formats tracking tag using environment variables with safe fallback values.
 */
export function getProviderTrackingTag(provider: AffiliateProvider): string {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) return 'fpvlovers';
  return process.env[config.envKey] || config.defaultTag;
}

/**
 * Helper to safely parse and normalize URL format (ensuring protocols are present).
 */
function safeParseUrl(urlStr: string): URL | null {
  let formatted = urlStr.trim();
  if (formatted.startsWith('//')) {
    formatted = 'https:' + formatted;
  } else if (!/^https?:\/\//i.test(formatted)) {
    formatted = 'https://' + formatted;
  }
  
  try {
    return new URL(formatted);
  } catch {
    return null;
  }
}

/**
 * Resolves an affiliate link for the specified provider, product details, and optional fallback URL.
 */
export function resolveAffiliateUrl(
  provider: string,
  brand: string,
  model: string,
  fallbackUrl?: string
): string {
  const query = [brand?.trim(), model?.trim()].filter(Boolean).join(' ');

  // 1. Try resolving provider by name
  let matched = findProvider(provider);

  // 2. Parse fallbackUrl if provided
  let urlObj: URL | null = null;
  if (fallbackUrl) {
    urlObj = safeParseUrl(fallbackUrl);
    // If provider is not matched yet, try to auto-detect from hostname
    if (!matched && urlObj) {
      matched = detectProviderFromUrl(urlObj);
    }
  }

  // 3. Resolve using matched provider
  if (matched) {
    const { key, config } = matched;
    const tag = getProviderTrackingTag(key);

    if (urlObj) {
      // Clean up double slashes in pathname (e.g. `//dp/B0B8...` -> `/dp/B0B8...`)
      urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');
      
      // Merge/overwrite tracking parameters
      for (const param of config.trackingParams) {
        urlObj.searchParams.set(param, tag);
      }
      return urlObj.toString();
    } else {
      // Fallback is NOT provided, generate storefront or search URL
      return config.searchUrlTemplate(query, tag);
    }
  }

  // 4. Fallback when provider is not matched/supported
  const defaultTag = process.env.AFFILIATE_DEFAULT_TAG || 'fpvlovers';

  if (urlObj) {
    urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');
    // Set standard affiliate params as generic fallback
    urlObj.searchParams.set('ref', defaultTag);
    urlObj.searchParams.set('aff', defaultTag);
    return urlObj.toString();
  }

  // If no fallback URL, search on Amazon using default tag as general storefront
  const amazonConfig = PROVIDER_CONFIGS.Amazon;
  const amazonTag = getProviderTrackingTag('Amazon');
  return amazonConfig.searchUrlTemplate(query, amazonTag);
}

export const CONSENT_COOKIE = 'fpv_consent';
export const CONSENT_VERSION = '2026-10-31';

export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = {
  version: string;
  id: string;
  decidedAt: string;
  categories: ConsentCategories;
};

export function createConsentState(
  categories: { analytics: boolean; marketing: boolean },
  id: string = crypto.randomUUID(),
  decidedAt: Date = new Date(),
): ConsentState {
  return {
    version: CONSENT_VERSION,
    id,
    decidedAt: decidedAt.toISOString(),
    categories: { necessary: true, analytics: categories.analytics === true, marketing: categories.marketing === true },
  };
}

export function serializeConsentCookie(state: ConsentState): string {
  return JSON.stringify(state);
}

export function parseConsentCookie(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION || !parsed.categories) return null;
    return {
      version: CONSENT_VERSION,
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : 'unknown',
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : new Date().toISOString(),
      categories: {
        necessary: true,
        analytics: parsed.categories.analytics === true,
        marketing: parsed.categories.marketing === true,
      },
    };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(state: ConsentState | null): boolean {
  return state?.categories.analytics === true;
}

export function hasMarketingConsent(state: ConsentState | null): boolean {
  return state?.categories.marketing === true;
}

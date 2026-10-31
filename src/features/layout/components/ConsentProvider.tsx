'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  createConsentState,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentCategories,
  type ConsentState,
} from '@/lib/consent/consent';

type ConsentContextValue = {
  consent: ConsentState | null;
  ready: boolean;
  saving: boolean;
  saveError: boolean;
  preferencesOpen: boolean;
  save: (categories: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readConsentCookie(): string | null {
  const prefix = `${CONSENT_COOKIE}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

const ANALYTICS_COOKIE_PREFIXES = ['_ga', '_gid', '_gat'];

/**
 * Unmounting `<GoogleAnalytics>` stops new tags but not the gtag.js instance
 * that already booted, and it never removes the `_ga*` cookies. Expire every
 * analytics cookie JS can see, for the host-only, host and parent-domain scopes
 * gtag.js may have written them to.
 */
function expireAnalyticsCookies(): void {
  const domains = ['', location.hostname, `.${location.hostname}`];
  for (const row of document.cookie.split('; ')) {
    const name = row.split('=')[0];
    if (!name || !ANALYTICS_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Max-Age=0${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

// Cookies emit no change event. The banner is the only writer in this tab and
// calls `save` explicitly, so the store is read on every render instead of subscribed.
function subscribeToConsentCookie(): () => void {
  return () => undefined;
}

/**
 * `true` only after hydration, so the server HTML never contains the banner or
 * any analytics markup and the first client paint matches the server one.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeToConsentCookie, () => true, () => false);
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const ready = useHydrated();
  const rawCookie = useSyncExternalStore(subscribeToConsentCookie, readConsentCookie, () => null);
  const stored = useMemo(() => parseConsentCookie(rawCookie), [rawCookie]);
  const [saved, setSaved] = useState<ConsentState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // A decision taken in this session wins over the cookie snapshot it just wrote.
  const consent = saved ?? stored;

  const save = useCallback(async (categories: { analytics: boolean; marketing: boolean }) => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);

    const state = createConsentState(categories);
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: state.id,
          policyVersion: CONSENT_VERSION,
          source: 'banner',
          categories: state.categories,
        }),
      });
      // The cookie is what enables analytics, so it must never outrun the audit
      // record: an unreachable or refusing API leaves the visitor unanswered
      // instead of granting analytics without proof of consent.
      if (!response.ok) throw new Error(`Consent API responded ${response.status}`);
    } catch {
      setSaveError(true);
      setSaving(false);
      return;
    }

    // Withdrawal (true -> false) is the only case that needs more than a cookie
    // write: gtag.js keeps beaconing until the page is torn down.
    const withdrawingAnalytics = consent?.categories.analytics === true && categories.analytics !== true;
    if (withdrawingAnalytics) expireAnalyticsCookies();

    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsentCookie(state))}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setSaved(state);
    setPreferencesOpen(false);
    setSaving(false);

    // Reloading re-runs the shell without consent, so gtag.js is never booted
    // again and no further beacons are sent. Grants and first choices never reload.
    if (withdrawingAnalytics) window.location.reload();
  }, [consent, saving]);

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    ready,
    saving,
    saveError,
    preferencesOpen,
    save,
    openPreferences: () => {
      setSaveError(false);
      setPreferencesOpen(true);
    },
    closePreferences: () => setPreferencesOpen(false),
  }), [consent, ready, saving, saveError, preferencesOpen, save]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used inside ConsentProvider');
  return context;
}

export type { ConsentCategories };

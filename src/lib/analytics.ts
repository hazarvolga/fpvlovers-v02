"use client";

import { CONSENT_COOKIE, hasAnalyticsConsent, parseConsentCookie } from '@/lib/consent/consent';

interface TrackEventPayload {
  eventType: string;
  contentSlug?: string;
  metadata?: Record<string, unknown>;
}

// Reads the consent cookie straight from the document so this module stays
// usable outside React (plain functions, non-component callers).
function readAnalyticsConsent(): boolean {
  try {
    const prefix = `${CONSENT_COOKIE}=`;
    const row = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));
    if (!row) return false;
    return hasAnalyticsConsent(parseConsentCookie(row.slice(prefix.length)));
  } catch {
    // A blocked cookie jar is indistinguishable from a denial.
    return false;
  }
}

export async function trackEvent(payload: TrackEventPayload) {
  // Use a non-blocking fetch to avoid slowing down UI
  if (typeof window === 'undefined') return;

  // First-party analytics are only collected after an explicit opt-in.
  // Missing or malformed consent means no analytics (deny by default).
  if (!readAnalyticsConsent()) return;

  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        source: 'frontend',
      }),
      // keepalive helps ensure the request finishes even if the user navigates away
      keepalive: true
    });
  } catch (error) {
    console.error('Failed to send analytics event:', error);
  }
}

// Helper wrappers for specific events

export function trackRelatedArticleClick(sourceSlug: string, targetSlug: string) {
  trackEvent({
    eventType: 'related_article_click',
    contentSlug: sourceSlug,
    metadata: {
      targetSlug,
      component: 'related_articles_widget'
    }
  });
}

export function trackNextStepClick(sourceSlug: string, targetSlug: string) {
  trackEvent({
    eventType: 'next_step_click',
    contentSlug: sourceSlug,
    metadata: {
      targetSlug,
      component: 'progression_widget'
    }
  });
}

export function trackSearchEvent(query: string, resultCount: number, filtersApplied: Record<string, string>) {
  trackEvent({
    eventType: 'search_performed',
    metadata: {
      query,
      resultCount,
      filtersApplied
    }
  });
}

export function trackHubView(hubType: 'topic' | 'component', hubName: string) {
  trackEvent({
    eventType: 'hub_view',
    metadata: {
      hubType,
      hubName
    }
  });
}

export function trackSearchResultClick(query: string, targetSlug: string) {
  trackEvent({
    eventType: 'search_result_click',
    contentSlug: targetSlug,
    metadata: {
      query
    }
  });
}

export function trackReviewClick(reviewSlug: string, metadata?: Record<string, unknown>) {
  trackEvent({
    eventType: 'review_click',
    contentSlug: reviewSlug,
    metadata
  });
}

export function trackComparisonClick(comparisonSlug: string, metadata?: Record<string, unknown>) {
  trackEvent({
    eventType: 'comparison_click',
    contentSlug: comparisonSlug,
    metadata
  });
}

export function trackBuyerGuideClick(guideSlug: string, metadata?: Record<string, unknown>) {
  trackEvent({
    eventType: 'buyer_guide_click',
    contentSlug: guideSlug,
    metadata
  });
}

export function trackAffiliateClick(slug: string, provider: string, url: string, metadata?: Record<string, unknown>) {
  trackEvent({
    eventType: 'affiliate_click',
    contentSlug: slug,
    metadata: {
      ...metadata,
      provider,
      url
    }
  });
}

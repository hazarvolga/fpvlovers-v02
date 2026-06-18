"use client";

interface TrackEventPayload {
  eventType: string;
  contentSlug?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(payload: TrackEventPayload) {
  // Use a non-blocking fetch to avoid slowing down UI
  if (typeof window === 'undefined') return;

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

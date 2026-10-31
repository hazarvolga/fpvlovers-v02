'use client';

import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { useConsent } from './ConsentProvider';

export function ConsentGatedAnalytics({ gaId, vercelEnabled }: { gaId?: string; vercelEnabled?: boolean }) {
  const { consent, ready } = useConsent();
  if (!ready || !consent?.categories.analytics) return null;
  return (
    <>
      {vercelEnabled ? <Analytics /> : null}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}

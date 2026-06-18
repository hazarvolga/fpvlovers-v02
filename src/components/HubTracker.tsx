"use client";

import { useEffect } from 'react';
import { trackHubView } from '@/lib/analytics';

interface HubTrackerProps {
  hubType: 'topic' | 'component';
  hubName: string;
}

export function HubTracker({ hubType, hubName }: HubTrackerProps) {
  useEffect(() => {
    trackHubView(hubType, hubName);
  }, [hubType, hubName]);

  return null;
}

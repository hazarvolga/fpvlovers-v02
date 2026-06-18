import { NextResponse } from 'next/server';
import { logAnalyticsEvent } from '@/lib/server/analytics-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, contentSlug, source, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Missing eventType' }, { status: 400 });
    }

    await logAnalyticsEvent({
      eventType,
      contentSlug,
      source: source || 'frontend',
      metadata
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

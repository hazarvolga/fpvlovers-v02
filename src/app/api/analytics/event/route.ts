import { NextRequest, NextResponse } from 'next/server';
import { logAnalyticsEvent } from '@/lib/server/analytics-store';
import { rateLimit } from '@/lib/server/rate-limit';

export async function POST(request: NextRequest) {
  // Higher ceiling than the form endpoints: this fires on normal page/widget
  // interactions, but still needs a cap against flood/DB-write abuse.
  const limitRes = rateLimit(request, 60, 60 * 1000, 'analytics-event');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitRes.limit),
          'X-RateLimit-Remaining': String(limitRes.remaining),
          'X-RateLimit-Reset': String(limitRes.reset),
        },
      }
    );
  }

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

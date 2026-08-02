import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';

const subscribeSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  source: z.string().optional().default('footer_form'),
});

export async function POST(request: NextRequest) {
  // Writes to the subscriber table on every call; rate-limit to stop
  // automated sign-up spam and email-enumeration probing.
  const limitRes = rateLimit(request, 5, 60 * 1000, 'newsletter-subscribe');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
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
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid submission data.', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, source } = result.data;

    // Check if email already exists
    const existing = await query<{ id: string; is_active: boolean }>(
      'SELECT id, is_active FROM fpvlovers_app.newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const subscriber = existing.rows[0];
      if (!subscriber.is_active) {
        // Reactivate
        await query(
          'UPDATE fpvlovers_app.newsletter_subscribers SET is_active = true, unsubscribed_at = NULL WHERE id = $1',
          [subscriber.id]
        );
        return NextResponse.json({ message: 'Subscription reactivated.', status: 'reactivated' });
      }
      return NextResponse.json({ message: 'This email address is already subscribed.', status: 'exists' });
    }

    // Insert new subscriber
    await query(
      `INSERT INTO fpvlovers_app.newsletter_subscribers (email, source, is_active)
       VALUES ($1, $2, true)`,
      [email, source || 'website']
    );

    return NextResponse.json({ message: 'You are subscribed!', status: 'created' }, { status: 201 });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while subscribing.' },
      { status: 500 }
    );
  }
}

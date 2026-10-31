import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';
import { sendEmail } from '@/lib/server/mailer';
import { buildConfirmationEmail, NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter/messages';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  source: z.string().max(100).optional().default('footer_form'),
  consent: z.literal(true),
  locale: z.enum(['tr', 'en']).optional().default('tr'),
});

const GENERIC_MESSAGE = 'If this address can be subscribed, a confirmation email has been sent.';

export async function POST(request: NextRequest) {
  const limitRes = rateLimit(request, 5, 60 * 1000, 'newsletter-subscribe');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'X-RateLimit-Limit': String(limitRes.limit), 'X-RateLimit-Remaining': String(limitRes.remaining), 'X-RateLimit-Reset': String(limitRes.reset) } },
    );
  }

  // In production the legal pages 404 without a configured controller, so
  // subscriptions must fail closed rather than collect data behind a dead notice.
  if (process.env.NODE_ENV === 'production' && !isLegalControllerConfigured(getLegalController())) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  try {
    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid submission data.', details: parsed.error.format() }, { status: 400 });
    }

    const { email, source, locale } = parsed.data;
    const existing = await query<{ id: string; status: string; consent_at: Date | null }>(
      'SELECT id, status, consent_at FROM fpvlovers_app.newsletter_subscribers WHERE lower(email) = $1 ORDER BY subscribed_at ASC LIMIT 1',
      [email],
    );

    // Legacy rows are status='active' with consent_at NULL; they must be able to re-consent.
    if (existing.rows[0]?.status === 'active' && existing.rows[0]?.consent_at) {
      return NextResponse.json({ message: GENERIC_MESSAGE, status: 'pending' }, { status: 202 });
    }

    const subscriberId = existing.rows[0]?.id ?? crypto.randomUUID();

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO fpvlovers_app.newsletter_subscribers
           (id, email, source, is_active, status, consent_version, consent_source)
         VALUES ($1, $2, $3, false, 'pending', $4, $5)`,
        [subscriberId, email, source, NEWSLETTER_CONSENT_VERSION, source],
      );
    } else {
      await query(
        `UPDATE fpvlovers_app.newsletter_subscribers
         SET email = $2, status = 'pending', is_active = false, unsubscribed_at = NULL,
             subscribed_at = NOW(), confirmed_at = NULL, consent_at = NULL,
             consent_version = $3, consent_source = $4
         WHERE id = $1`,
        [subscriberId, email, NEWSLETTER_CONSENT_VERSION, source],
      );
    }

    const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
    const confirmation = buildConfirmationEmail({ baseUrl, subscriberId, locale });
    await sendEmail({ to: email, ...confirmation });

    return NextResponse.json({ message: GENERIC_MESSAGE, status: 'pending' }, { status: 202 });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong while subscribing.' }, { status: 500 });
  }
}

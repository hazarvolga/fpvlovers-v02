import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/server/rate-limit';
import { sendEmail } from '@/lib/server/mailer';
import { buildConfirmationEmail, NEWSLETTER_CONSENT_VERSION } from '@/lib/newsletter/messages';

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

  try {
    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid submission data.', details: parsed.error.format() }, { status: 400 });
    }

    const { email, source, locale } = parsed.data;
    const existing = await query<{ id: string; status: string }>(
      'SELECT id, status FROM fpvlovers_app.newsletter_subscribers WHERE email = $1',
      [email],
    );

    if (existing.rows[0]?.status === 'active') {
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
         SET status = 'pending', is_active = false, unsubscribed_at = NULL,
             consent_version = $2, consent_source = $3
         WHERE id = $1`,
        [subscriberId, NEWSLETTER_CONSENT_VERSION, source],
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

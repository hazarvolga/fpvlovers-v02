import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/server/db';
import { rateLimit } from '@/lib/server/rate-limit';
import { CONSENT_VERSION } from '@/lib/consent/consent';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';

const schema = z.object({
  consentId: z.string().min(8).max(100),
  policyVersion: z.literal(CONSENT_VERSION),
  source: z.string().max(100).optional().default('banner'),
  categories: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  // Unauthenticated write endpoint: cap it per IP so the audit table cannot be flooded.
  const limitRes = rateLimit(request, 30, 60 * 1000, 'consent');
  if (!limitRes.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  // Consent must not be recorded while the notice it refers to is unreachable
  // (production legal pages 404 without a configured controller).
  if (process.env.NODE_ENV === 'production' && !isLegalControllerConfigured(getLegalController())) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Malformed JSON is a client error, not a server fault.
    return NextResponse.json({ error: 'Invalid consent payload.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid consent payload.' }, { status: 400 });
  }

  try {
    const { consentId, policyVersion, source, categories } = parsed.data;
    await query(
      `INSERT INTO fpvlovers_app.consent_records (consent_id, categories, policy_version, source)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT (consent_id) DO UPDATE
       SET categories = EXCLUDED.categories, policy_version = EXCLUDED.policy_version, source = EXCLUDED.source`,
      [consentId, JSON.stringify(categories), policyVersion, source],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Consent] Failed to record consent:', error);
    return NextResponse.json({ error: 'Consent could not be recorded.' }, { status: 500 });
  }
}

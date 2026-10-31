import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/server/db';
import { CONSENT_VERSION } from '@/lib/consent/consent';

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
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid consent payload.' }, { status: 400 });
    }

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

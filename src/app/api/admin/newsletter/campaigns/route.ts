import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import type { NewsletterCampaignRow } from '@/lib/server/db-types';

export async function GET() {
  try {
    const result = await query<NewsletterCampaignRow>(
      `SELECT * FROM fpvlovers_app.newsletter_campaigns ORDER BY created_at DESC LIMIT 50`
    );
    return NextResponse.json({ campaigns: result.rows });
  } catch (error) {
    console.error('[GET /api/admin/newsletter/campaigns] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, content_html, content_md } = body;

    if (!subject || !content_html) {
      return NextResponse.json({ error: 'Subject and HTML content are required' }, { status: 400 });
    }

    const insertResult = await query<NewsletterCampaignRow>(
      `INSERT INTO fpvlovers_app.newsletter_campaigns (subject, content_html, content_md, status) 
       VALUES ($1, $2, $3, 'draft') RETURNING *`,
      [subject, content_html, content_md || null]
    );

    return NextResponse.json({ campaign: insertResult.rows[0] });
  } catch (error) {
    console.error('[POST /api/admin/newsletter/campaigns] Error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

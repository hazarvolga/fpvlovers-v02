import { NextResponse } from 'next/server';
import { listPublishedContent } from '@/lib/content-automation/content-reader';
import { requireAdmin } from '@/lib/server/admin-auth-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const articles = listPublishedContent();
    return NextResponse.json({ success: true, articles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

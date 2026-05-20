import { NextResponse } from 'next/server';
import { listPublishedContent } from '@/lib/content-automation/content-reader';

export async function GET() {
  try {
    const articles = listPublishedContent();
    return NextResponse.json({ success: true, articles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

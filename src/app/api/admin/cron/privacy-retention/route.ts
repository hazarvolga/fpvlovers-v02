import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { query } from '@/lib/server/db';
import { purgeExpiredPrivacyData } from '@/lib/server/privacy-retention';

// Scheduled from Coolify like the other cron routes; the runtime image does not
// ship scripts/ or tsx, so this endpoint is the only in-container entry point.
export async function GET(req: Request) {
  const auth = authorizeCronRequest(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const result = await purgeExpiredPrivacyData(query);
    return NextResponse.json({ success: true, purged: result });
  } catch (error) {
    console.error('CRON Privacy Retention Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

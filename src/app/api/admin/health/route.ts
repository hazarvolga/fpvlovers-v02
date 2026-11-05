import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin-auth-guard';
import { collectAdminHealth } from '@/lib/server/admin-health';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(await collectAdminHealth());
}

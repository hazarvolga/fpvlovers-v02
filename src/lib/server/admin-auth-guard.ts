import { auth } from '@/lib/server/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await auth();
  // Not authenticated
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Authenticated but not admin — use 403 to distinguish from unauthenticated
  if ((session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }
  return null; // authorized
}

import { auth } from '@/lib/server/auth';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function requireAdmin() {
  // 1. Check NextAuth Session first
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === 'admin' || role === 'super_admin') {
      return null; // Authorized
    }
  }

  // 2. Fallback to Basic Auth Check (so Basic Auth users can call API routes)
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const user = process.env.ADMIN_USER;
      const pass = process.env.ADMIN_PASS;
      if (user && pass) {
        const credentials = atob(authHeader.slice(6)).split(':');
        if (credentials[0] === user && credentials[1] === pass) {
          return null; // Authorized via Basic Auth
        }
      }
    }
  } catch (err) {
    console.error('[requireAdmin] Error reading headers for basic auth fallback:', err);
  }

  // Not authenticated/authorized
  if (session?.user) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

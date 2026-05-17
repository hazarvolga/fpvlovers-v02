import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
    const auth = req.headers.get('authorization');
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASS;

    if (!user || !pass) {
      return new NextResponse('Admin auth is not configured', { status: 503 });
    }

    if (!auth || !auth.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      });
    }

    let providedUser = '';
    let providedPass = '';
    try {
      [providedUser, providedPass] = atob(auth.slice(6)).split(':');
    } catch {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      });
    }

    if (providedUser !== user || providedPass !== pass) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
      });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

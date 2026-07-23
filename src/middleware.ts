import NextAuth from "next-auth";
import { authConfig } from "@/lib/server/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function getSessionRole(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) return undefined;
  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role : undefined;
}

function readPresentedCronSecret(req: { headers: Headers; nextUrl: URL }): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret) return headerSecret.trim();

  return req.nextUrl.searchParams.get("cron_secret");
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // 1. Admin & API Admin Protection (Basic Auth + NextAuth fallback)
  if (nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin")) {
    const isLocalDev = process.env.NODE_ENV !== "production"
      && ["localhost", "127.0.0.1", "::1"].includes(nextUrl.hostname);
    if (isLocalDev) {
      return NextResponse.next();
    }

    // Bypass Basic Auth for cron requests carrying the configured cron secret.
    const isCronRoute = nextUrl.pathname.startsWith("/api/admin/cron");
    if (isCronRoute) {
      const cronSecretHeader = readPresentedCronSecret(req);
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && cronSecretHeader === cronSecret) {
        return NextResponse.next();
      }
    }

    // Let NextAuth admin/super_admin sessions bypass Basic Auth
    const role = getSessionRole(req.auth?.user);
    if (isLoggedIn && (role === "admin" || role === "super_admin")) {
      return NextResponse.next();
    }

    const authHeader = req.headers.get("authorization");
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASS;

    if (!user || !pass) {
      return new NextResponse("Admin auth is not configured", { status: 503 });
    }

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
      });
    }

    let providedUser = "";
    let providedPass = "";
    try {
      [providedUser, providedPass] = atob(authHeader.slice(6)).split(":");
    } catch {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
      });
    }

    if (providedUser !== user || providedPass !== pass) {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
      });
    }
  }

  // 2. Protect only authenticated Pilot Progress API endpoint
  const isProtectedPilotRoute = nextUrl.pathname === "/api/pilot/progress";
  if (isProtectedPilotRoute && !isLoggedIn) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/pilot/progress",
  ],
};

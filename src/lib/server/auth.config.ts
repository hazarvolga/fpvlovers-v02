import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import GitHub from "next-auth/providers/github";

const DEV_AUTH_SECRET = "fpvlovers-dev-only-auth-secret-change-before-production";

const isProductionRuntime = () =>
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.FPV_ALLOW_INSECURE_AUTH_SECRET !== "true";

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) {
    if (isProductionRuntime() && secret.length < 32) {
      throw new Error("AUTH_SECRET/NEXTAUTH_SECRET must be at least 32 characters in production.");
    }
    return secret;
  }

  if (isProductionRuntime()) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be configured in production.");
  }

  return DEV_AUTH_SECRET;
};

export const authConfig = {
  secret: getAuthSecret(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "dummy",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "dummy",
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID || "dummy",
      clientSecret: process.env.AUTH_DISCORD_SECRET || "dummy",
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || "dummy",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "dummy",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt", // Highly optimized Stateless JWT sessions for Edge compatibility
    maxAge: 3600, // 1 hour token expiration
  },
  trustHost: true, // Necessary for Coolify reverse-proxy domain routing
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
      const isProtectedPilotRoute = nextUrl.pathname === "/api/pilot/progress";

      // Handle Basic Auth for local fallback or protect via Admin Session
      if (isAdminRoute) {
        if (isLoggedIn) {
          const userRole = (auth.user as any).role;
          return userRole === "admin" || userRole === "super_admin";
        }
        return false;
      }

      if (isProtectedPilotRoute) {
        return isLoggedIn;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "pilot";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

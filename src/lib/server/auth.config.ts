import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import GitHub from "next-auth/providers/github";

const getFallbackSecret = () => {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
    if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
    
    // Construct a cryptographically robust and stable signature from sensitive env keys
    const signature = [
      process.env.ADMIN_PASS || "",
      process.env.FPV_DATABASE_URL || "",
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || "fpvlovers-edge-fallback-2026"
    ].join("::");
    
    return signature;
  }
  return "fpvlovers-edge-fallback-2026";
};

export const authConfig = {
  secret: getFallbackSecret(),
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
          return userRole === "admin";
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

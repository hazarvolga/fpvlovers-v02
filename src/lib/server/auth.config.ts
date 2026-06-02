import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import GitHub from "next-auth/providers/github";

export const authConfig = {
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

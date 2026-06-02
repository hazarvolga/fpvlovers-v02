import NextAuth from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import Credentials from "next-auth/providers/credentials";
import { getPool, query } from "./db";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(getPool() as any),
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();

        // Query the custom users table using parameterized safety
        const res = await query(
          "SELECT id, name, email, password_hash, role, image FROM fpvlovers_app.users WHERE email = $1",
          [email]
        );

        const user = res.rows[0];
        if (!user || !user.password_hash) return null;

        // Secure password comparison using Edge-compatible bcryptjs
        const isValid = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image
        };
      }
    })
  ]
});

import { query } from "@/lib/server/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "@/lib/server/rate-limit";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(128, "Password is too long."),
  name: z.string().trim().min(2, "Name must be at least 2 characters long.").max(120, "Name is too long."),
});

export async function POST(req: NextRequest) {
  // Registration writes to the database and hashes with bcrypt (CPU-heavy);
  // rate-limit to stop automated account creation / enumeration probing.
  const limitRes = rateLimit(req, 5, 60 * 1000, 'pilot-register');
  if (!limitRes.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitRes.limit),
          'X-RateLimit-Remaining': String(limitRes.remaining),
          'X-RateLimit-Reset': String(limitRes.reset),
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid registration data." },
        { status: 400 }
      );
    }

    const { email: trimmedEmail, password, name } = parsed.data;

    // Verify if email is already registered in custom users table
    const checkUser = await query(
      "SELECT id FROM fpvlovers_app.users WHERE email = $1",
      [trimmedEmail]
    );

    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into fpvlovers_app.users
    const result = await query(
      `INSERT INTO fpvlovers_app.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, trimmedEmail, passwordHash, "pilot"]
    );

    // Populate empty pilot progress profile atomically
    await query(
      `INSERT INTO fpvlovers_app.pilot_progress (user_id, completed_steps, quiz_scores, current_specialization)
       VALUES ($1, '[]'::jsonb, '{}'::jsonb, 'Beginner')
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id]
    );

    return NextResponse.json({
      success: true,
      message: "Pilot registered successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to register pilot", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

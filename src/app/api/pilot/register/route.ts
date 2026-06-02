import { query } from "@/lib/server/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "E-posta, şifre ve isim alanları zorunludur." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Verify if email is already registered in custom users table
    const checkUser = await query(
      "SELECT id FROM fpvlovers_app.users WHERE email = $1",
      [trimmedEmail]
    );

    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten tescil edilmiş." }, { status: 409 });
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into fpvlovers_app.users
    const result = await query(
      `INSERT INTO fpvlovers_app.users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), trimmedEmail, passwordHash, "pilot"]
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
      message: "Pilot başarıyla tescil edildi.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to register pilot", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { NextResponse } from "next/server";

// 1. GET: Retrieve authenticated pilot's progress from PostgreSQL
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await query(
      "SELECT completed_steps, quiz_scores, current_specialization FROM fpvlovers_app.pilot_progress WHERE user_id = $1",
      [userId]
    );

    if (res.rows.length === 0) {
      // Lazy initialization of progress data
      return NextResponse.json({
        completed_steps: [],
        quiz_scores: {},
        current_specialization: "Beginner",
      });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Failed to retrieve pilot progress", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Upsert and atomically merge pilot's progress
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const completedSteps = body.completed_steps || [];
    const quizScores = body.quiz_scores || {};
    const specialization = body.current_specialization || "Beginner";

    const stepsJson = JSON.stringify(completedSteps);
    const quizJson = JSON.stringify(quizScores);

    // Phase 2 Fix: Use explicit transaction with FOR UPDATE row-level lock 
    // to prevent JSONB merge race conditions and connection pool exhaustion.
    const { getClient } = await import("@/lib/server/db");
    const client = await getClient();
    
    try {
      await client.query("BEGIN");

      // Lock the row for this specific user
      const existingRes = await client.query(
        "SELECT completed_steps, quiz_scores, current_specialization FROM fpvlovers_app.pilot_progress WHERE user_id = $1 FOR UPDATE",
        [userId]
      );

      if (existingRes.rows.length === 0) {
        // Insert new record
        const insertRes = await client.query(
          `INSERT INTO fpvlovers_app.pilot_progress (user_id, completed_steps, quiz_scores, current_specialization)
           VALUES ($1, $2::jsonb, $3::jsonb, $4)
           RETURNING completed_steps, quiz_scores, current_specialization;`,
          [userId, stepsJson, quizJson, specialization]
        );
        await client.query("COMMIT");
        return NextResponse.json({ success: true, data: insertRes.rows[0] });
      }

      // Deep merge in TypeScript
      const existing = existingRes.rows[0];
      const mergedSteps = Array.from(new Set([...(existing.completed_steps || []), ...completedSteps]));
      const mergedScores = { ...(existing.quiz_scores || {}), ...quizScores };
      const newSpecialization = specialization !== "Beginner" ? specialization : existing.current_specialization;

      // Update the locked row
      const updateRes = await client.query(
        `UPDATE fpvlovers_app.pilot_progress 
         SET completed_steps = $2::jsonb, 
             quiz_scores = $3::jsonb, 
             current_specialization = $4, 
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING completed_steps, quiz_scores, current_specialization;`,
        [userId, JSON.stringify(mergedSteps), JSON.stringify(mergedScores), newSpecialization]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        data: updateRes.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to upsert/merge pilot progress", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

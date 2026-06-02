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
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
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

    // Format inputs safely for JSONB mapping
    const stepsJson = JSON.stringify(completedSteps);
    const quizJson = JSON.stringify(quizScores);

    // Bulletproof atomic SQL merge query resolving any concurrent race conditions
    const upsertQuery = `
      INSERT INTO fpvlovers_app.pilot_progress (user_id, completed_steps, quiz_scores, current_specialization)
      VALUES ($1, $2::jsonb, $3::jsonb, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        completed_steps = (
          SELECT COALESCE(jsonb_agg(DISTINCT x), '[]'::jsonb)
          FROM (
            SELECT jsonb_array_elements(pilot_progress.completed_steps) x
            UNION
            SELECT jsonb_array_elements(EXCLUDED.completed_steps) x
          ) t
        ),
        quiz_scores = pilot_progress.quiz_scores || EXCLUDED.quiz_scores,
        current_specialization = COALESCE(NULLIF(EXCLUDED.current_specialization, 'Beginner'), pilot_progress.current_specialization),
        updated_at = NOW()
      RETURNING completed_steps, quiz_scores, current_specialization;
    `;

    const res = await query(upsertQuery, [userId, stepsJson, quizJson, specialization]);

    return NextResponse.json({
      success: true,
      data: res.rows[0],
    });
  } catch (error) {
    console.error("Failed to upsert/merge pilot progress", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

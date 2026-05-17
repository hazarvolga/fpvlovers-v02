import { GoogleGenAI } from "@google/genai";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const video = formData.get("video") as unknown as File;

    if (!video) {
      return Response.json({ error: "No video provided." }, { status: 400 });
    }

    // Convert video to buffer and write to tmp
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tmpPath = join("/tmp", `flight-${Date.now()}.mp4`);
    await writeFile(tmpPath, buffer);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Mocked Response if no API key
      await new Promise((r) => setTimeout(r, 2500));
      return Response.json({
         scores: { flow: 85, speed: 78, proximity: 92, acro: 88, stability: 70 },
         verdict: "A-Proximity God",
         summary: "Exceptional gap hunting and proximity confidence. PID tuning could be optimized to reduce propwash during high G-force maneuvers.",
         telemetrySimulation: [
           { timestamp: "00:03", event: "High-G Split-S", riskScore: "High" },
           { timestamp: "00:08", event: "Gap cleared", riskScore: "Extreme" },
         ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Upload to Gemini
    const uploadedFile = await ai.files.upload({
        file: tmpPath,
    });

    const prompt = `
You are an expert FPV drone judge and aeronautical telemetry analyst.
Analyze the provided FPV flight video and evaluate the pilot's performance across 5 specific axes, scoring each from 0 to 100:
1. Flow & Smoothness (Transitions between maneuvers)
2. Speed Consistency (Throttle management)
3. Proximity & Risk (Gap hunting, obstacle proximity)
4. Acrowork Quality (Precision of flips, rolls, dives)
5. Stability (Absence of propwash, PID vibrations)

Return a structured JSON output exactly in this format (no markdown code blocks, just raw JSON):
{
  "scores": {
    "flow": number,
    "speed": number,
    "proximity": number,
    "acro": number,
    "stability": number
  },
  "verdict": "S1-Elite Pilot" | "A-Proximity God" | "B-Rookie Hunter" | "C-Trainee",
  "summary": "A punchy, 2-sentence breakdown of their flight style.",
  "telemetrySimulation": [
    { "timestamp": "00:05", "event": "High-G Split-S", "riskScore": "High" }
  ]
}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            uploadedFile,
            prompt
        ],
        config: {
            responseMimeType: "application/json",
        }
    });

    const jsonText = response.text || "{}";
    return Response.json(JSON.parse(jsonText));

  } catch (error: any) {
    console.error("Video analysis error:", error);
    return Response.json({ error: error.message || "Failed to analyze video." }, { status: 500 });
  }
}

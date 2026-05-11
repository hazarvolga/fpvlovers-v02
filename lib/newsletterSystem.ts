/**
 * AUTOMATION WORKFLOW ARCHITECTURE: Dify RAG -> AI Summarization -> Beehiiv EMS
 * 
 * Step 1: Content Extraction
 * A scheduled Cron Job (e.g., via GitHub Actions, Vercel Cron, or n8n) calls our internal API.
 * The API queries the Dify RAG backend for the highest-scoring/most interacted items of the week:
 * - 3x Drone Hardware Parts
 * - 2x AI Flight Software/News
 * - 1x Top Community Clip
 * 
 * Step 2: AI Summarization (Gemini 2.0 / Dify Agent)
 * The raw data is passed through an LLM sequence using the "Excited but Technical Pilot" persona:
 * Prompt: "Take these 5 FPV updates. Summarize them as if you are a pro pilot on a discord channel telling your buddies about the sickest new gear. Keep it technical but hyped. Mention KV, thrust ratios, and latency."
 * 
 * Step 3: Template Generation
 * The structured AI response is injected into the HTML Email Template (renderWeeklyPropellerTemplate).
 * 
 * Step 4: Dispatch to Beehiiv via API
 * We map the final HTML to Beehiiv's payload structure.
 */

export interface NewsletterContent {
  subject: string;
  hardware: Array<{ name: string; specs: string; summary: string; url: string; price: string }>;
  aiNews: Array<{ title: string; summary: string }>;
  communityClip: { title: string; score: string; url: string };
}

// Map the generated content to Beehiiv Create Blast payload
export function buildBeehiivPayload(content: NewsletterContent, htmlBody: string) {
  return {
    title: content.subject,
    body_html: htmlBody,
    status: "draft",
    campaign_name: `Weekly Propeller - ${new Date().toISOString()}`,
    // Required Beehiiv mappings for external publishing
    content_tags: ["FPV", "Drones", "AI"],
    advanced_email_options: {
       web_version_enabled: true
    }
  };
}

// High-Tech Cyber-Aeronautic HTML Email Template
// Styled with strict Inline CSS for maximum email client compatibility.
export function renderWeeklyPropellerTemplate(content: NewsletterContent): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Weekly Propeller</title>
<style>
  body { margin: 0; padding: 0; background-color: #050810; font-family: 'Courier New', Courier, monospace; color: #f8fafc; }
  .container { max-width: 600px; margin: 0 auto; background-color: #050810; border-left: 1px solid #00F5FF33; border-right: 1px solid #00F5FF33; padding: 20px; }
  .header { border-bottom: 2px solid #00F5FF; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
  .header h1 { color: #ffffff; text-transform: uppercase; font-size: 28px; letter-spacing: 2px; margin: 0; }
  .header span { color: #00F5FF; }
  .section-title { font-size: 16px; color: #FFB800; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 15px; border-bottom: 1px solid #FFB80055; padding-bottom: 5px; }
  .card { background-color: #0a0f24; border: 1px solid #00F5FF55; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
  .card h3 { color: #ffffff; margin: 0 0 10px 0; font-size: 20px; text-transform: uppercase; }
  .specs { font-size: 12px; color: #00F5FF; margin-bottom: 10px; background-color: #050810; padding: 5px; border-radius: 4px; display: inline-block; }
  .text { color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif; }
  .btn { display: inline-block; background-color: #00F5FF; color: #050810; text-decoration: none; padding: 10px 20px; font-weight: bold; text-transform: uppercase; border-radius: 4px; margin-top: 15px; font-size: 12px; letter-spacing: 1px; }
  .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>The Weekly <span>Propeller</span></h1>
      <p style="color:#64748b; font-size: 12px; text-transform: uppercase; margin-top: 10px;">Flight Log // ${new Date().toLocaleDateString()}</p>
    </div>

    <h2 class="section-title">++ Top 3 Hardware Upgrades ++</h2>
    ${content.hardware.map(item => `
      <div class="card">
        <h3>${item.name}</h3>
        <div class="specs">>> SYS.SPECS: ${item.specs}</div>
        <div class="text">${item.summary}</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <a href="${item.url}" class="btn">Acquire Part // ${item.price}</a>
            </td>
          </tr>
        </table>
      </div>
    `).join('')}

    <h2 class="section-title">++ AI Flight Intelligence ++</h2>
    ${content.aiNews.map(news => `
      <div class="card" style="border-color: #FFB80055;">
        <h3 style="color: #FFB800;">[SYS.UPDATE] ${news.title}</h3>
        <div class="text">${news.summary}</div>
      </div>
    `).join('')}

    <h2 class="section-title">++ Community Clip of the Week ++</h2>
    <div class="card" style="text-align: center; border-style: dashed;">
      <h3 style="color: #00F5FF;">${content.communityClip.title}</h3>
      <div class="specs" style="color: #FFB800;">>> AI RATING: ${content.communityClip.score}</div>
      <div>
        <a href="${content.communityClip.url}" class="btn" style="background-color: transparent; border: 1px solid #00F5FF; color: #00F5FF;">VIEW TELEMETRY</a>
      </div>
    </div>

    <div class="footer">
      <p>AffexAI Oracle Neural Network | Transmission Authorized</p>
      <p><a href="{{unsubscribe_link}}" style="color: #64748b;">DISCONNECT</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

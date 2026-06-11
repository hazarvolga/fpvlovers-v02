import { query } from './db';
import { runWorkflow } from '../dify-client';
import { sendEmail } from './mailer';
import type { NewsletterSubscriberRow, NewsletterCampaignRow } from './db-types';

export class NewsletterOrchestrator {
  /**
   * Generates a new newsletter draft via Dify based on the top contents of the week.
   */
  static async generateDraftCampaign(): Promise<string> {
    try {
      console.log('[NewsletterOrchestrator] Gathering weekly context for Dify...');
      // TODO: In a fully implemented version, this would query Google Analytics
      // or the `fpvlovers_analytics` schema for actual top viewed articles.
      // For now, we fetch the latest 3 published articles as a placeholder for "top content".
      
      const recentArticles = await query<{ title: string; excerpt: string; slug: string }>(
        `SELECT title, excerpt, slug FROM fpvlovers_app.published_articles_shadow 
         ORDER BY published_at DESC NULLS LAST LIMIT 3`
      );

      const contextData = recentArticles.rows.map((a: { title: string; excerpt: string; slug: string }) => `- ${a.title}: ${a.excerpt} (Link: /academy/${a.slug})`).join('\n');
      
      const payloadContext = `Top Articles of the Week:\n${contextData}\n\nHardware Pick: Check out our Hardware Analyzer!`;

      console.log('[NewsletterOrchestrator] Calling Dify workflow to generate newsletter content...');
      const difyResponse = await runWorkflow(
        'newsletter-cron',
        { context: payloadContext },
        process.env.DIFY_PUBLISHER_WORKFLOW_TOKEN || 'MISSING_TOKEN'
      );

      // The Dify workflow is expected to return markdown or HTML.
      const rawContent = (difyResponse.outputs?.text as string) || 'Dify did not return text content.';

      console.log('[NewsletterOrchestrator] Saving generated campaign as Draft...');
      const insertResult = await query<NewsletterCampaignRow>(
        `INSERT INTO fpvlovers_app.newsletter_campaigns (subject, content_html, content_md, status) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [
          `FPV Lovers Haftalık Özet - ${new Date().toLocaleDateString('tr-TR')}`,
          rawContent, // Assumes Dify returns HTML for now, otherwise we convert.
          rawContent,
          'draft'
        ]
      );

      return insertResult.rows[0].id;
    } catch (error) {
      console.error('[NewsletterOrchestrator] Error generating draft campaign:', error);
      throw error;
    }
  }

  /**
   * Dispatches a specific campaign to all active subscribers.
   */
  static async dispatchCampaign(campaignId: string): Promise<{ success: boolean; sentCount: number }> {
    try {
      // 1. Fetch Campaign
      const campaignRes = await query<NewsletterCampaignRow>(
        `SELECT * FROM fpvlovers_app.newsletter_campaigns WHERE id = $1`,
        [campaignId]
      );

      if (campaignRes.rowCount === 0) {
        throw new Error(`Campaign ${campaignId} not found.`);
      }

      const campaign = campaignRes.rows[0];
      if (campaign.status === 'sent') {
        throw new Error(`Campaign ${campaignId} is already sent.`);
      }

      // 2. Fetch Active Subscribers
      const subRes = await query<NewsletterSubscriberRow>(
        `SELECT email FROM fpvlovers_app.newsletter_subscribers WHERE is_active = true`
      );
      
      const emails = subRes.rows.map((r: { email: string }) => r.email);

      if (emails.length === 0) {
        console.log('[NewsletterOrchestrator] No active subscribers found. Skipping dispatch.');
        return { success: true, sentCount: 0 };
      }

      console.log(`[NewsletterOrchestrator] Dispatching campaign "${campaign.subject}" to ${emails.length} subscribers...`);

      // 3. Send Email (using BCC or individual calls depending on scale, currently bulk BCC for simplicity)
      const emailResult = await sendEmail({
        to: emails, // Note: In production with thousands of users, chunking & using BCC is better.
        subject: campaign.subject,
        html: campaign.content_html,
        text: campaign.content_md || undefined
      });

      if (!emailResult.success) {
        throw new Error('Mailer failed to send campaign emails.');
      }

      // 4. Update Campaign Status
      await query(
        `UPDATE fpvlovers_app.newsletter_campaigns 
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP, recipient_count = $1 
         WHERE id = $2`,
        [emails.length, campaignId]
      );

      return { success: true, sentCount: emails.length };

    } catch (error) {
      console.error('[NewsletterOrchestrator] Error dispatching campaign:', error);
      throw error;
    }
  }
}

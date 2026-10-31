import { query } from './db';
import { runWorkflow } from '../dify-client';
import { sendEmail } from './mailer';
import { appendUnsubscribeFooter, buildListUnsubscribeHeaders, buildUnsubscribeUrl } from '../newsletter/messages';
import type { NewsletterCampaignRow } from './db-types';

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

      const subRes = await query<{ id: string; email: string }>(
        `SELECT id, email FROM fpvlovers_app.newsletter_subscribers
         WHERE is_active = true AND status = 'active' AND consent_at IS NOT NULL`
      );

      if (subRes.rows.length === 0) {
        console.log('[NewsletterOrchestrator] No consenting active subscribers found. Skipping dispatch.');
        return { success: true, sentCount: 0 };
      }

      console.log(`[NewsletterOrchestrator] Dispatching campaign "${campaign.subject}" to ${subRes.rows.length} subscribers...`);

      const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
      let sentCount = 0;
      let failureCount = 0;

      for (const subscriber of subRes.rows) {
        const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, subscriber.id);
        const emailResult = await sendEmail({
          to: subscriber.email,
          subject: campaign.subject,
          html: appendUnsubscribeFooter(campaign.content_html, unsubscribeUrl, 'tr'),
          text: campaign.content_md || undefined,
          headers: buildListUnsubscribeHeaders(unsubscribeUrl),
        });
        if (emailResult.success) sentCount += 1;
        else failureCount += 1;
      }

      if (sentCount === 0) {
        throw new Error('Mailer failed to send campaign emails.');
      }

      await query(
        `UPDATE fpvlovers_app.newsletter_campaigns
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP, recipient_count = $1
         WHERE id = $2`,
        [sentCount, campaignId]
      );

      console.log(`[NewsletterOrchestrator] Campaign sent to ${sentCount} subscribers (${failureCount} failures).`);
      return { success: true, sentCount };

    } catch (error) {
      console.error('[NewsletterOrchestrator] Error dispatching campaign:', error);
      throw error;
    }
  }
}

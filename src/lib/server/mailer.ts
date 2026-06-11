import nodemailer from 'nodemailer';

const config = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const transporter = nodemailer.createTransport(config);

/**
 * Sends an email using the configured SMTP server.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `FPV Lovers <${process.env.SMTP_FROM_EMAIL || 'newsletter@fpvlovers.com.tr'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    });
    console.log(`[Mailer] Message sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mailer] Error sending email:`, error);
    return { success: false, error };
  }
}

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const INQUIRY_TYPES = ['Affiliate', 'Partnership', 'Vendor', 'Content Correction', 'General'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, inquiryType, message } = body;

    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      errors.push('Please provide a valid email address.');
    }

    if (!inquiryType || typeof inquiryType !== 'string' || !INQUIRY_TYPES.includes(inquiryType)) {
      errors.push(`Inquiry type must be one of: ${INQUIRY_TYPES.join(', ')}`);
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 2000) {
      errors.push('Message must be between 10 and 2000 characters long.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Securely log submission payload to server console/stdout (no PII leakage to third-parties)
    console.log('[ContactFormSubmit] New Inquiry received:', {
      name: name.trim(),
      email: email.trim(),
      inquiryType,
      messageLength: message.trim().length,
      timestamp: new Date().toISOString()
    });

    // SMTP Mailer configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const receiver = process.env.CONTACT_RECEIVER || 'hello@fpvlovers.com.tr';

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"FPVLovers Operations" <${smtpUser}>`,
          to: receiver,
          subject: `[${inquiryType}] New Inquiry from ${name.trim()}`,
          text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nInquiry Type: ${inquiryType}\n\nMessage:\n${message.trim()}`,
          html: `
            <div style="font-family: monospace; background-color: #050810; color: #ffffff; padding: 20px; border: 1px solid #00F2FF;">
              <h2 style="color: #00F2FF; border-bottom: 1px solid #00F2FF; padding-bottom: 10px;">[FPVLOVERS SYSTEM TELEMETRY]</h2>
              <p><strong>Sender Name:</strong> ${name.trim()}</p>
              <p><strong>Sender Email:</strong> ${email.trim()}</p>
              <p><strong>Inquiry Class:</strong> ${inquiryType}</p>
              <p><strong>Payload:</strong></p>
              <pre style="background-color: #0A0A0B; padding: 15px; border: 1px solid #222; color: #a0a0a0; white-space: pre-wrap;">${message.trim()}</pre>
              <div style="font-size: 10px; color: #666; margin-top: 20px; border-top: 1px solid #222; padding-top: 10px;">
                Timestamp: ${new Date().toISOString()} | Target Node: ${receiver}
              </div>
            </div>
          `,
        });
        console.log('[ContactFormSubmit] Email sent successfully to:', receiver);
      } catch (mailErr: unknown) {
        console.error('[ContactFormSubmit] Failed to send email via SMTP:', mailErr instanceof Error ? mailErr.message : String(mailErr));
      }
    } else {
      console.log('[ContactFormSubmit] SMTP parameters missing, skipped email transmission.');
    }

    return NextResponse.json({
      success: true,
      message: 'Transmission received. Our operations team will respond shortly.'
    });

  } catch (err: unknown) {
    console.error('[ContactApi] Unexpected submission error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ success: false, errors: ['Internal server error during transmission.'] }, { status: 500 });
  }
}

import nodemailer from 'nodemailer';

async function main() {
  console.log('Testing Resend SMTP connection...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'FPVLovers <newsletter@fpvlovers.com>',
      to: 'hello@fpvlovers.com', // Using a generic address for testing
      subject: 'FPVLovers - Test Email',
      text: 'Bu bir test e-postasıdır. Resend entegrasyonu başarılı!',
      html: '<b>Bu bir test e-postasıdır.</b><br>Resend entegrasyonu başarılı!',
    });

    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

main();

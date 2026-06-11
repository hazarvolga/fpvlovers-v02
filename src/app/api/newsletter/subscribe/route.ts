import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  source: z.string().optional().default('footer_form'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, source } = result.data;

    // Check if email already exists
    const existing = await query<{ id: string; is_active: boolean }>(
      'SELECT id, is_active FROM fpvlovers_app.newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const subscriber = existing.rows[0];
      if (!subscriber.is_active) {
        // Reactivate
        await query(
          'UPDATE fpvlovers_app.newsletter_subscribers SET is_active = true, unsubscribed_at = NULL WHERE id = $1',
          [subscriber.id]
        );
        return NextResponse.json({ message: 'Abonelik yeniden aktifleştirildi.', status: 'reactivated' });
      }
      return NextResponse.json({ message: 'Bu e-posta adresi zaten bültene kayıtlı.', status: 'exists' });
    }

    // Insert new subscriber
    await query(
      `INSERT INTO fpvlovers_app.newsletter_subscribers (email, source, status, is_active)
       VALUES ($1, $2, 'subscribed', true)`,
      [email, source || 'website']
    );

    return NextResponse.json({ message: 'Bültene başarıyla kayıt oldunuz!', status: 'created' }, { status: 201 });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

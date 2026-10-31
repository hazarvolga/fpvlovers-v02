import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { verifyConfirmToken } from '@/lib/newsletter/tokens';

function page(status: number, title: string, message: string): Response {
  return new Response(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="background:#050810;color:#e5e7eb;font-family:system-ui;padding:48px;text-align:center"><h1>${title}</h1><p>${message}</p><p><a style="color:#ff5c00" href="/">FPVLovers</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'tr';

  if (!id || !token || !verifyConfirmToken(id, token)) {
    return page(400, lang === 'en' ? 'Invalid link' : 'Geçersiz bağlantı', lang === 'en' ? 'This confirmation link is invalid or expired.' : 'Bu onay bağlantısı geçersiz veya süresi dolmuş.');
  }

  const result = await query(
    `UPDATE fpvlovers_app.newsletter_subscribers
     SET status = 'active', is_active = true, confirmed_at = NOW(), consent_at = NOW(), unsubscribed_at = NULL
     WHERE id = $1 AND status = 'pending'
     RETURNING id`,
    [id],
  );

  if (result.rowCount === 0) {
    return page(400, lang === 'en' ? 'Link no longer valid' : 'Bağlantı artık geçerli değil', lang === 'en' ? 'This confirmation link was already used or is no longer valid.' : 'Bu onay bağlantısı daha önce kullanılmış veya artık geçerli değil.');
  }

  return page(200, lang === 'en' ? 'Subscription confirmed' : 'Abonelik onaylandı', lang === 'en' ? 'You will receive the FPVLovers newsletter. You can unsubscribe from any email.' : 'FPVLovers bültenini alacaksınız. Her e-postadan abonelikten çıkabilirsiniz.');
}

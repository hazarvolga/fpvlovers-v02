import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { verifyUnsubscribeToken } from '@/lib/newsletter/tokens';

function page(status: number, title: string, message: string): Response {
  return new Response(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="background:#050810;color:#e5e7eb;font-family:system-ui;padding:48px;text-align:center"><h1>${title}</h1><p>${message}</p><p><a style="color:#ff5c00" href="/">FPVLovers</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function unsubscribe(request: NextRequest): Promise<Response> {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';

  if (!id || !token || !verifyUnsubscribeToken(id, token)) {
    return page(400, 'Geçersiz bağlantı', 'Bu abonelik iptali bağlantısı geçersiz.');
  }

  await query(
    `UPDATE fpvlovers_app.newsletter_subscribers
     SET status = 'unsubscribed', is_active = false, unsubscribed_at = NOW()
     WHERE id = $1`,
    [id],
  );

  return page(200, 'Abonelikten çıkıldı', 'Artık FPVLovers bülteni almayacaksınız.');
}

export async function GET(request: NextRequest) {
  return unsubscribe(request);
}

export async function POST(request: NextRequest) {
  return unsubscribe(request);
}

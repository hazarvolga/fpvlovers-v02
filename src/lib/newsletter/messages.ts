import { signConfirmToken, signUnsubscribeToken } from './tokens';

export const NEWSLETTER_CONSENT_VERSION = '2026-10-31';

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function buildConfirmUrl(
  baseUrl: string,
  subscriberId: string,
  expiresAt: number,
  locale: 'tr' | 'en',
): string {
  const token = signConfirmToken(subscriberId, expiresAt);
  return `${trimBase(baseUrl)}/api/newsletter/confirm?id=${encodeURIComponent(subscriberId)}&token=${encodeURIComponent(token)}&lang=${locale}`;
}

export function buildUnsubscribeUrl(baseUrl: string, subscriberId: string): string {
  const token = signUnsubscribeToken(subscriberId);
  return `${trimBase(baseUrl)}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}&token=${encodeURIComponent(token)}`;
}

export function buildListUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

export function buildConfirmationEmail({
  baseUrl,
  subscriberId,
  locale,
}: {
  baseUrl: string;
  subscriberId: string;
  locale: 'tr' | 'en';
}): { subject: string; html: string; text: string } {
  const confirmUrl = buildConfirmUrl(baseUrl, subscriberId, Date.now() + 7 * 24 * 60 * 60 * 1000, locale);
  if (locale === 'en') {
    return {
      subject: 'Confirm your FPVLovers newsletter subscription',
      html: `<p>Please confirm your FPVLovers newsletter subscription.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, ignore this email.</p>`,
      text: `Confirm your FPVLovers newsletter subscription: ${confirmUrl}`,
    };
  }
  return {
    subject: 'FPVLovers bülten aboneliğinizi onaylayın',
    html: `<p>FPVLovers bülten aboneliğinizi onaylamak için aşağıdaki bağlantıya tıklayın.</p><p><a href="${confirmUrl}">Aboneliği onayla</a></p><p>Bu isteği siz yapmadıysanız e-postayı yok sayın.</p>`,
    text: `FPVLovers bülten aboneliğinizi onaylayın: ${confirmUrl}`,
  };
}

export function appendUnsubscribeFooter(
  html: string,
  unsubscribeUrl: string,
  locale: 'tr' | 'en',
): string {
  const label = locale === 'en' ? 'Unsubscribe' : 'Abonelikten çık';
  const note = locale === 'en'
    ? 'You are receiving this email because you confirmed a subscription.'
    : 'Bu e-postayı aboneliğinizi onayladığınız için alıyorsunuz.';
  return `${html}\n<hr /><p style="font-size:12px;color:#666">${note} <a href="${unsubscribeUrl}">${label}</a></p>`;
}

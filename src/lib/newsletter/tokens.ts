import crypto from 'node:crypto';

const DEV_SECRET = 'fpvlovers-newsletter-dev-secret-change-before-production';

function getSecret(): string {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEWSLETTER_TOKEN_SECRET or AUTH_SECRET must be configured in production.');
  }
  return DEV_SECRET;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signUnsubscribeToken(subscriberId: string): string {
  return sign(`unsubscribe:${subscriberId}`);
}

export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  return safeEqual(signUnsubscribeToken(subscriberId), token);
}

export function signConfirmToken(subscriberId: string, expiresAt: number): string {
  return `${expiresAt}.${sign(`confirm:${subscriberId}:${expiresAt}`)}`;
}

export function verifyConfirmToken(subscriberId: string, token: string, now = Date.now()): boolean {
  const separator = token.indexOf('.');
  if (separator < 1) return false;
  const expiresAt = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  return safeEqual(sign(`confirm:${subscriberId}:${expiresAt}`), signature);
}

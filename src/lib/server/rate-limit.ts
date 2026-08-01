import { NextRequest } from 'next/server';

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// Simple in-memory token store. Since Next.js runs in a persistent Node process in standalone mode,
// this Map will persist across requests on the same instance.
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  const globalAny = global as any;
  if (!globalAny.__rateLimitInterval) {
    globalAny.__rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}

function getClientIp(req: NextRequest): string {
  // X-Real-IP is normally set by the immediate reverse proxy (Traefik/nginx
  // in front of the Coolify deployment) from the actual TCP peer, so it
  // can't be forged by the client the way a raw request header can.
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // X-Forwarded-For is a comma-separated hop chain: "client, proxy1, proxy2...".
  // The FIRST entry is whatever the original client claimed (client-supplied,
  // trivially spoofable to defeat per-IP rate limiting). The LAST entry is
  // what our own trusted reverse proxy actually observed as its peer, so use
  // that instead.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((hop) => hop.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }

  return '127.0.0.1';
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Checks if a request exceeds the specified rate limit.
 * 
 * @param req NextRequest object
 * @param limit Max number of requests allowed in the window
 * @param windowMs Window duration in milliseconds (default: 60,000ms / 1 min)
 * @param endpoint Identifier for the endpoint (e.g. 'build-wizard')
 */
export function rateLimit(
  req: NextRequest,
  limit: number = 5,
  windowMs: number = 60 * 1000,
  endpoint: string = 'api'
): RateLimitResult {
  const ip = getClientIp(req);
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Initialize or reset the bucket
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: record.resetTime,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

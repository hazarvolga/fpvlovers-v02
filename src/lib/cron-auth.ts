import { NextResponse } from 'next/server';

type CronAuthSuccess = {
  authorized: true;
};

type CronAuthFailure = {
  authorized: false;
  response: NextResponse;
};

export type CronAuthResult = CronAuthSuccess | CronAuthFailure;

function readPresentedSecret(req: Request): string | null {
  const authorization = req.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const headerSecret = req.headers.get('x-cron-secret');
  if (headerSecret) return headerSecret.trim();

  const url = new URL(req.url);
  return url.searchParams.get('cron_secret');
}

export function authorizeCronRequest(req: Request): CronAuthResult {
  const configuredSecret = process.env.CRON_SECRET || process.env.CRON_AUTH_TOKEN;

  if (!configuredSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'CRON_SECRET is not configured',
        },
        { status: 503 },
      ),
    };
  }

  const presentedSecret = readPresentedSecret(req);
  if (presentedSecret !== configuredSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized cron request',
        },
        { status: 401 },
      ),
    };
  }

  return { authorized: true };
}

import crypto from 'crypto';

interface GA4Metrics {
  active_users: number;
  page_views: number;
  sessions: number;
}

function signJwt(payload: Record<string, unknown>, privateKey: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const sign = crypto.createSign('SHA256');
  sign.update(`${base64Header}.${base64Payload}`);
  
  // Format the key properly to make sure it includes the standard headers and correct newlines
  const formattedKey = privateKey.replace(/\\n/g, '\n').trim();
  
  const signature = sign.sign(formattedKey, 'base64url');
  return `${base64Header}.${base64Payload}.${signature}`;
}

export async function fetchGoogleAnalyticsReport(
  propertyId: string,
  clientEmail: string,
  privateKey: string
): Promise<GA4Metrics> {
  const defaultMetrics: GA4Metrics = {
    active_users: 0,
    page_views: 0,
    sessions: 0,
  };

  if (!propertyId || !clientEmail || !privateKey) {
    return defaultMetrics;
  }

  try {
    // 1. Generate assertion JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const assertion = signJwt(payload, privateKey);

    // 2. Request access token from OAuth2
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.warn('[GA4] Failed to retrieve access token:', errorText);
      return defaultMetrics;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // 3. Query the GA4 API runReport endpoint
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'sessions' },
          ],
        }),
      }
    );

    if (!reportRes.ok) {
      const errorText = await reportRes.text();
      console.warn('[GA4] runReport request failed:', errorText);
      return defaultMetrics;
    }

    const reportData = (await reportRes.json()) as {
      rows?: Array<{
        metricValues?: Array<{ value?: string }>;
      }>;
    };

    // Extract values safely
    const values = reportData.rows?.[0]?.metricValues || [];
    const activeUsers = parseInt(values[0]?.value || '0', 10);
    const pageViews = parseInt(values[1]?.value || '0', 10);
    const sessions = parseInt(values[2]?.value || '0', 10);

    return {
      active_users: isNaN(activeUsers) ? 0 : activeUsers,
      page_views: isNaN(pageViews) ? 0 : pageViews,
      sessions: isNaN(sessions) ? 0 : sessions,
    };
  } catch (err) {
    console.warn('[GA4] Error fetching report:', err);
    return defaultMetrics;
  }
}

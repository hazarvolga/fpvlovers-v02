// Shared SSRF guard: rejects loopback/link-local/RFC-1918 targets so a
// crawled or user-supplied URL can't be used to reach internal
// infrastructure (metadata endpoints, internal services, etc.) from a
// server-side fetch.
export function isPublicHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return false;
    if (h === '::1' || h === '[::1]' || h.startsWith('::ffff:127.')) return false;

    const ipv4Match = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.slice(1).map(Number);
      if (a === 10) return false; // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
      if (a === 192 && b === 168) return false; // 192.168.0.0/16
      if (a === 169 && b === 254) return false; // 169.254.0.0/16 (link-local, incl. cloud metadata)
      if (a === 127) return false; // 127.0.0.0/8
    }

    return true;
  } catch {
    return false;
  }
}

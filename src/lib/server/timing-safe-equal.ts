// Portable constant-time string comparison — works in both the Node runtime
// (route handlers) and the Edge runtime (middleware), where Node's
// crypto.timingSafeEqual isn't available. Runs a fixed number of iterations
// (the longer input's byte length) regardless of where the strings first
// diverge, so response timing can't be used to recover a secret one
// character at a time.
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  const maxLen = Math.max(bufA.length, bufB.length, 1);

  let diff = bufA.length === bufB.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

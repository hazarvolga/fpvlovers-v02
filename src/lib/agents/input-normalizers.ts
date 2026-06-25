export function inputString(
  input: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = input[key];
  return typeof value === 'string' ? value : fallback;
}

export function inputNumber(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = input[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function inputMode(
  input: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = input[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

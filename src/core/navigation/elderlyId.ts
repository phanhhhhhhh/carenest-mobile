const MAX_JAVA_LONG = BigInt('9223372036854775807');

/** Normalizes backend elderly IDs without accepting zero, decimals, or malformed values. */
export function normalizeElderlyId(value: unknown): string | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;

  try {
    return BigInt(normalized) <= MAX_JAVA_LONG ? normalized : null;
  } catch {
    return null;
  }
}

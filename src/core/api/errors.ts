/**
 * Centralized API error helpers — used by all Zustand stores.
 *
 * Port of the error-extraction patterns that were duplicated across
 * 16 Flutter providers. Single source of truth so fixes and logging
 * apply everywhere.
 */

/** Extract HTTP status code from an axios-style error object. */
export function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

/** Extract a human-readable error message from any thrown value. */
export function getErrorMessage(e: unknown): string {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    const err = e as Record<string, unknown>;
    if (typeof err.message === 'string' && err.message.length > 0) return err.message;
    if (err.response && typeof err.response === 'object') {
      const res = err.response as Record<string, unknown>;
      if (res.data && typeof res.data === 'object') {
        const data = res.data as Record<string, unknown>;
        if (typeof data.message === 'string') return data.message;
        if (typeof data.error === 'string') return data.error;
      }
    }
  }
  return 'unknown error';
}

/** Extract error message with a configurable fallback (used by auth & notification stores). */
export function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return `${fallback}: ${(e as { message?: string }).message ?? ''}`;
  }
  return fallback;
}

/** Extract `response.data` from an axios error, if present. */
export function getResponseData(e: unknown): unknown {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { data?: unknown } }).response?.data;
  }
  return undefined;
}

/** Safely cast unknown data to an array of plain objects (used by list endpoints). */
export function asListOfMaps(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) =>
      e && typeof e === 'object' ? (e as Record<string, unknown>) : {},
    );
  }
  return [];
}

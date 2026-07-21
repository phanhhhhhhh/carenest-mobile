


export function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}


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


export function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return `${fallback}: ${(e as { message?: string }).message ?? ''}`;
  }
  return fallback;
}


export function getResponseData(e: unknown): unknown {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { data?: unknown } }).response?.data;
  }
  return undefined;
}


export function asListOfMaps(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) =>
      e && typeof e === 'object' ? (e as Record<string, unknown>) : {},
    );
  }
  return [];
}


/** True when `e` is an axios/DOM cancellation from an aborted request — not a real failure. */
export function isCancelled(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as Record<string, unknown>;
  return err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError';
}

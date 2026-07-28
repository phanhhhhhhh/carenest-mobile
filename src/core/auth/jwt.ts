const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Hermes doesn't reliably provide a global `atob`/`Buffer`, and JWT segments are
// base64url (`-`/`_` instead of `+`/`/`, no `=` padding) which `atob` rejects
// anyway — so decode manually with plain string/array operations only.
export function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');

    let bytes = '';
    let buffer = 0;
    let bitsCollected = 0;
    for (const char of normalized) {
      const value = BASE64_CHARS.indexOf(char);
      if (value === -1) continue;
      buffer = (buffer << 6) | value;
      bitsCollected += 6;
      if (bitsCollected >= 8) {
        bitsCollected -= 8;
        bytes += String.fromCharCode((buffer >> bitsCollected) & 0xff);
      }
    }

    return decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (decoded == null) return null;
  try {
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Seconds until the token's `exp` (negative when already expired), or null when the token has no readable expiry. */
export function jwtSecondsRemaining(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== 'number') return null;
  return exp - Date.now() / 1000;
}

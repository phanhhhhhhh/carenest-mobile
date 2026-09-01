import { decodeBase64Url, decodeJwtPayload, jwtSecondsRemaining } from './jwt';

/** Build a fake JWT with the given payload object (header + signature are dummies). */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

describe('decodeBase64Url', () => {
  it('decodes standard base64url without padding', () => {
    const encoded = Buffer.from('hello world').toString('base64url');
    expect(decodeBase64Url(encoded)).toBe('hello world');
  });

  it('decodes multi-byte UTF-8 (Vietnamese)', () => {
    const encoded = Buffer.from('Xin chào bạn').toString('base64url');
    expect(decodeBase64Url(encoded)).toBe('Xin chào bạn');
  });

  it('ignores characters outside the base64 alphabet instead of throwing', () => {
    expect(decodeBase64Url('!!!!')).toBe('');
  });
});

describe('decodeJwtPayload', () => {
  it('returns the payload object for a well-formed token', () => {
    const token = makeJwt({ sub: '42', role: 'ELDERLY', exp: 1893456000 });
    expect(decodeJwtPayload(token)).toEqual({ sub: '42', role: 'ELDERLY', exp: 1893456000 });
  });

  it('returns null when the token does not have three segments', () => {
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('not-a-token')).toBeNull();
  });

  it('returns null when the payload segment is not valid JSON', () => {
    const token = `${Buffer.from('{}').toString('base64url')}.@@@@.sig`;
    expect(decodeJwtPayload(token)).toBeNull();
  });
});

describe('jwtSecondsRemaining', () => {
  const NOW = 1_700_000_000_000; // fixed wall clock

  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW));
  afterEach(() => jest.restoreAllMocks());

  it('is positive for a token that expires in the future', () => {
    const token = makeJwt({ exp: NOW / 1000 + 300 });
    expect(jwtSecondsRemaining(token)).toBeCloseTo(300, 0);
  });

  it('is negative for an already-expired token', () => {
    const token = makeJwt({ exp: NOW / 1000 - 120 });
    expect(jwtSecondsRemaining(token)!).toBeLessThan(0);
  });

  it('returns null when the token has no numeric exp', () => {
    expect(jwtSecondsRemaining(makeJwt({ sub: '1' }))).toBeNull();
    expect(jwtSecondsRemaining('garbage')).toBeNull();
  });
});

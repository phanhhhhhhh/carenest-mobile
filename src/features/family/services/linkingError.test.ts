import { getLinkingFailure } from './linkingError';

describe('getLinkingFailure', () => {
  it('preserves the backend plan-limit explanation', () => {
    expect(
      getLinkingFailure(
        { response: { status: 402, data: { error: 'Đã đạt giới hạn gói cước' } } },
        'request',
      ),
    ).toEqual({
      kind: 'premium_required',
      message: 'Đã đạt giới hạn gói cước',
      retryable: false,
    });
  });

  it('gives QR-specific guidance for a missing token', () => {
    const result = getLinkingFailure({ response: { status: 404 } }, 'qr');
    expect(result.kind).toBe('not_found');
    expect(result.message).toContain('tạo mã mới');
    expect(result.retryable).toBe(true);
  });

  it('does not confuse a failed lookup with an absent account', () => {
    expect(getLinkingFailure({ code: 'ERR_NETWORK' }, 'lookup').kind).toBe('network');
  });

  it('maps duplicate links to a stable user-facing message', () => {
    const result = getLinkingFailure({ response: { status: 409 } }, 'request');
    expect(result.kind).toBe('already_linked');
    expect(result.retryable).toBe(false);
  });
});

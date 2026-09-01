import {
  getStatus,
  getErrorMessage,
  extractError,
  getResponseData,
  asListOfMaps,
  isCancelled,
  isNetworkError,
} from './errors';

describe('getStatus', () => {
  it('reads response.status from an axios-shaped error', () => {
    expect(getStatus({ response: { status: 404 } })).toBe(404);
  });
  it('is undefined for non-axios errors', () => {
    expect(getStatus(new Error('boom'))).toBeUndefined();
    expect(getStatus(null)).toBeUndefined();
    expect(getStatus('string error')).toBeUndefined();
  });
});

describe('getErrorMessage', () => {
  it('prefers the backend body message over the generic axios message', () => {
    const err = {
      message: 'Request failed with status code 400',
      response: { data: { message: 'Email đã tồn tại' } },
    };
    expect(getErrorMessage(err)).toBe('Email đã tồn tại');
  });

  it('falls back to response.data.error', () => {
    const err = { response: { data: { error: 'Invalid token' } } };
    expect(getErrorMessage(err)).toBe('Invalid token');
  });

  it('falls back to the top-level message when there is no response body', () => {
    expect(getErrorMessage({ message: 'Network Error' })).toBe('Network Error');
  });

  it('handles strings and nullish input', () => {
    expect(getErrorMessage('plain')).toBe('plain');
    expect(getErrorMessage(null)).toBe('unknown error');
    expect(getErrorMessage({})).toBe('unknown error');
  });
});

describe('extractError', () => {
  it('appends the resolved message to the fallback', () => {
    const err = { response: { data: { message: 'hết hạn' } } };
    expect(extractError(err, 'Lỗi khi tải')).toBe('Lỗi khi tải: hết hạn');
  });
  it('returns the bare fallback when nothing usable is present', () => {
    expect(extractError({}, 'Lỗi khi tải')).toBe('Lỗi khi tải');
  });
});

describe('getResponseData / asListOfMaps', () => {
  it('returns response.data when present', () => {
    expect(getResponseData({ response: { data: [1, 2] } })).toEqual([1, 2]);
  });
  it('coerces only arrays of objects, replacing primitives with {}', () => {
    expect(asListOfMaps([{ a: 1 }, 'x', null])).toEqual([{ a: 1 }, {}, {}]);
    expect(asListOfMaps('nope')).toEqual([]);
  });
});

describe('isCancelled', () => {
  it.each([{ code: 'ERR_CANCELED' }, { name: 'CanceledError' }, { name: 'AbortError' }])(
    'is true for %o',
    (err) => {
      expect(isCancelled(err)).toBe(true);
    },
  );
  it('is false for a real error', () => {
    expect(isCancelled({ code: 'ERR_BAD_REQUEST' })).toBe(false);
    expect(isCancelled(null)).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('is true when the request never reached the server', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true);
  });
  it('is false once there is a response (a 4xx/5xx is not a network error)', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK', response: { status: 500 } })).toBe(false);
  });
  it('is false for unrelated errors', () => {
    expect(isNetworkError(new Error('boom'))).toBe(false);
  });
});

import { normalizeElderlyId } from './elderlyId';

describe('normalizeElderlyId', () => {
  it.each([
    ['42', '42'],
    [' 42 ', '42'],
    [42, '42'],
  ])('normalizes %p', (input, expected) => {
    expect(normalizeElderlyId(input)).toBe(expected);
  });

  it.each([undefined, null, '', '0', 0, -1, 1.5, '1.5', 'abc', Number.NaN, Infinity])(
    'rejects %p',
    (input) => {
      expect(normalizeElderlyId(input)).toBeNull();
    },
  );
});

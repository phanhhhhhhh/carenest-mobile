import { greeting, formatTimeFromIso, formatDateHeader } from './utils';

describe('greeting', () => {
  const withHour = (h: number, fn: () => void) => {
    const spy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(h);
    try {
      fn();
    } finally {
      spy.mockRestore();
    }
  };

  it('says morning before noon', () =>
    withHour(8, () => expect(greeting()).toBe('Chào buổi sáng')));
  it('says afternoon between 12 and 18', () =>
    withHour(15, () => expect(greeting()).toBe('Chào buổi chiều')));
  it('says evening from 18 on', () => withHour(21, () => expect(greeting()).toBe('Chào buổi tối')));
  it('treats exactly noon as afternoon', () =>
    withHour(12, () => expect(greeting()).toBe('Chào buổi chiều')));
});

describe('formatTimeFromIso', () => {
  it('formats HH:mm, zero-padded', () => {
    expect(formatTimeFromIso('2026-03-01T09:05:00')).toBe('09:05');
  });
  it('returns "" for missing or unparseable input', () => {
    expect(formatTimeFromIso(undefined)).toBe('');
    expect(formatTimeFromIso('not-a-date')).toBe('');
  });
});

describe('formatDateHeader', () => {
  it('includes the Vietnamese weekday and d/m/y', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T10:00:00')); // a Tuesday
    expect(formatDateHeader()).toBe('Thứ Ba, 1/9/2026');
    jest.useRealTimers();
  });
});

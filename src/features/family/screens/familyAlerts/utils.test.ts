import { eventTitle, eventIcon, eventColor, formatRelative, hexToRgba } from './utils';

describe('event type mapping', () => {
  it('maps SOS/EMERGENCY aliases to the same title and icon', () => {
    expect(eventTitle('SOS')).toBe('Khẩn cấp SOS');
    expect(eventTitle('EMERGENCY')).toBe('Khẩn cấp SOS');
    expect(eventIcon('SOS')).toBe('alert-circle');
  });
  it('maps medication aliases', () => {
    expect(eventTitle('MISSED_MEDICATION')).toBe('Bỏ lỡ uống thuốc');
    expect(eventTitle('MEDICATION_REMINDER')).toBe('Bỏ lỡ uống thuốc');
    expect(eventIcon('MISSED_MEDICATION')).toBe('medkit');
  });
  it('falls back to a generic label/icon/color for unknown types', () => {
    expect(eventTitle('WHATEVER')).toBe('Cảnh báo');
    expect(eventIcon('WHATEVER')).toBe('notifications');
    expect(eventColor('WHATEVER')).toMatch(/^#/);
  });
});

describe('formatRelative', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-09-01T12:00:00')));
  afterEach(() => jest.useRealTimers());

  it('"Vừa xong" under a minute', () => {
    expect(formatRelative('2026-09-01T11:59:30')).toBe('Vừa xong');
  });
  it('minutes within the hour', () => {
    expect(formatRelative('2026-09-01T11:30:00')).toBe('30 phút trước');
  });
  it('same-day older than an hour shows "Hôm nay HH:mm"', () => {
    expect(formatRelative('2026-09-01T08:05:00')).toBe('Hôm nay 8:05');
  });
  it('previous day shows "Hôm qua HH:mm"', () => {
    expect(formatRelative('2026-08-31T22:00:00')).toBe('Hôm qua 22:00');
  });
  it('older shows an N-day count', () => {
    expect(formatRelative('2026-08-27T09:00:00')).toBe('5 ngày trước');
  });
});

describe('hexToRgba', () => {
  it('expands a 6-digit hex with the given alpha', () => {
    expect(hexToRgba('#2E7D9A', 0.5)).toBe('rgba(46, 125, 154, 0.5)');
  });
  it('tolerates a missing leading #', () => {
    expect(hexToRgba('FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
  });
});

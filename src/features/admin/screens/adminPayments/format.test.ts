import { planLabel, formatVnd, timeAgo } from './format';

describe('planLabel', () => {
  it('maps known plan types to Vietnamese labels', () => {
    expect(planLabel('PREMIUM_MONTHLY')).toBe('Premium Hàng tháng');
    expect(planLabel('PREMIUM_YEARLY')).toBe('Premium Hàng năm');
  });
  it('passes an unknown plan type through unchanged', () => {
    expect(planLabel('WEIRD_PLAN')).toBe('WEIRD_PLAN');
  });
});

describe('formatVnd', () => {
  it('groups thousands and appends the dong sign', () => {
    expect(formatVnd(49000)).toBe('49.000đ');
    expect(formatVnd(490000)).toBe('490.000đ');
  });
  it('truncates fractional amounts', () => {
    expect(formatVnd(49000.9)).toBe('49.000đ');
  });
  it('is safe for non-finite input', () => {
    expect(formatVnd(Number.NaN)).toBe('0đ');
  });
});

describe('timeAgo', () => {
  const NOW = new Date('2026-09-08T12:00:00Z').getTime();

  it('returns "" for missing or unparseable input', () => {
    expect(timeAgo(undefined, NOW)).toBe('');
    expect(timeAgo('not-a-date', NOW)).toBe('');
  });
  it('bucket: minutes / hours / days', () => {
    expect(timeAgo('2026-09-08T11:58:00Z', NOW)).toBe('2 phút trước');
    expect(timeAgo('2026-09-08T09:00:00Z', NOW)).toBe('3 giờ trước');
    expect(timeAgo('2026-09-06T12:00:00Z', NOW)).toBe('2 ngày trước');
  });
  it('clamps a future timestamp to "vừa xong"', () => {
    expect(timeAgo('2026-09-08T12:05:00Z', NOW)).toBe('vừa xong');
  });
});

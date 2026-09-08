import { secondsUntil, formatCountdown } from './countdown';

describe('secondsUntil', () => {
  const NOW = new Date('2026-09-08T10:00:00Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 0 for a null target', () => {
    expect(secondsUntil(null)).toBe(0);
  });

  it('returns whole seconds remaining, rounded down', () => {
    expect(secondsUntil('2026-09-08T10:02:30Z')).toBe(150);
    expect(secondsUntil('2026-09-08T10:00:00.900Z')).toBe(0);
  });

  it('clamps a past target to 0 rather than going negative', () => {
    expect(secondsUntil('2026-09-08T09:59:00Z')).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('zero-pads minutes and seconds', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(5)).toBe('00:05');
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(600)).toBe('10:00');
  });
});

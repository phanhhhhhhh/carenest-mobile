import { createVisitDateOptions, formatVisitDate } from './visitDates';

describe('createVisitDateOptions', () => {
  it('returns Today and the previous seven ICT dates', () => {
    const options = createVisitDateOptions(new Date('2026-09-14T03:15:20Z'));

    expect(options).toHaveLength(8);
    expect(options[0]).toMatchObject({
      daysAgo: 0,
      label: 'Hôm nay',
      dateLabel: '14/09/2026',
      visitedAt: '2026-09-14T10:15:20+07:00',
    });
    expect(options[1].label).toBe('Hôm qua');
    expect(options[7].visitedAt).toBe('2026-09-07T10:15:20+07:00');
    expect(
      options.every(
        (option) => new Date(option.visitedAt).getTime() <= Date.parse('2026-09-14T03:15:20Z'),
      ),
    ).toBe(true);
  });

  it('uses the correct ICT date around midnight', () => {
    const beforeMidnightUtc = createVisitDateOptions(new Date('2026-09-13T16:59:59Z'));
    const afterMidnightIct = createVisitDateOptions(new Date('2026-09-13T17:00:01Z'));

    expect(beforeMidnightUtc[0].dateLabel).toBe('13/09/2026');
    expect(afterMidnightIct[0].dateLabel).toBe('14/09/2026');
    expect(afterMidnightIct[1].visitedAt).toBe('2026-09-13T00:00:01+07:00');
  });
});

describe('formatVisitDate', () => {
  it('formats in vi-VN using Asia/Ho_Chi_Minh', () => {
    expect(formatVisitDate('2026-09-13T18:30:00Z')).toBe('14/09/2026');
  });
});

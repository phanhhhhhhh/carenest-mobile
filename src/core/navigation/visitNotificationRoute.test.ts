import {
  getVisitNotificationDestination,
  isVisitNotificationType,
  VISIT_NOTIFICATION_TYPES,
} from './visitNotificationRoute';

describe('Visit notification routing', () => {
  it.each(VISIT_NOTIFICATION_TYPES)('maps %s to FamilyVisitStreak', (type) => {
    expect(getVisitNotificationDestination({ type, elderlyId: '42' })).toEqual({
      name: 'FamilyVisitStreak',
      params: { elderlyId: '42' },
    });
  });

  it('accepts a positive numeric elderlyId', () => {
    expect(getVisitNotificationDestination({ type: 'VISIT_CONFIRMED', elderlyId: 42 })).toEqual({
      name: 'FamilyVisitStreak',
      params: { elderlyId: '42' },
    });
  });

  it.each([undefined, null, '', 0, '0', -1, Number.NaN, 'abc', 1.5])(
    'ignores invalid elderlyId %p',
    (elderlyId) => {
      expect(
        getVisitNotificationDestination({ type: 'VISIT_STREAK_REMINDER', elderlyId }),
      ).toBeNull();
    },
  );

  it('does not infer Visit routing from title or body text', () => {
    const payload = { title: 'VISIT_CONFIRMED', body: 'VISIT_STREAK_REMINDER', elderlyId: 42 };
    expect(getVisitNotificationDestination(payload)).toBeNull();
    expect(isVisitNotificationType(undefined)).toBe(false);
  });
});

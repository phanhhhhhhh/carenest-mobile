import type { Nav } from './utils';
import { routeForNotification } from './utils';

function navigationMock() {
  return { navigate: jest.fn() } as unknown as Nav;
}

describe('routeForNotification', () => {
  it.each([
    'VISIT_STREAK_REMINDER',
    'VISIT_CONFIRMED',
    'VISIT_BIRTHDAY_REMINDER',
    'VISIT_TET_REMINDER',
  ])('routes structured %s data to the selected elderly Visit screen', (type) => {
    const navigation = navigationMock();

    routeForNotification('FAMILY_UPDATE', { type, elderlyId: 8 }, 'FAMILY', navigation);

    expect(navigation.navigate).toHaveBeenCalledWith('FamilyVisitStreak', { elderlyId: '8' });
  });

  it('ignores invalid Visit data safely', () => {
    const navigation = navigationMock();
    routeForNotification(
      'FAMILY_UPDATE',
      { type: 'VISIT_CONFIRMED', elderlyId: 0 },
      'FAMILY',
      navigation,
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('preserves existing non-Visit routes', () => {
    const familyNavigation = navigationMock();
    const elderlyNavigation = navigationMock();

    routeForNotification('EMERGENCY', null, 'FAMILY', familyNavigation);
    routeForNotification('HEALTH_ALERT', null, 'ELDERLY', elderlyNavigation);
    routeForNotification('MEDICATION_REMINDER', null, 'FAMILY', familyNavigation);
    routeForNotification('APPOINTMENT_REMINDER', null, 'ELDERLY', elderlyNavigation);

    expect(familyNavigation.navigate).toHaveBeenCalledWith('FamilyAlerts');
    expect(familyNavigation.navigate).toHaveBeenCalledWith('FamilyShell', {
      screen: 'FamilyMeds',
    });
    expect(elderlyNavigation.navigate).toHaveBeenCalledWith('ElderlyHealth');
    expect(elderlyNavigation.navigate).toHaveBeenCalledWith('ElderlyAppointments');
  });

  it('does not use notification title text for Visit routing', () => {
    const navigation = navigationMock();
    routeForNotification('VISIT_CONFIRMED', null, 'FAMILY', navigation);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

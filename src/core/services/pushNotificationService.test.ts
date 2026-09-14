import { useAuthStore } from '../../features/auth/store/authStore';
import { navigateToTab, navigationRef } from '../navigation/navigationRef';
import { flushPendingDeepLink, navigateFromPayload } from './pushNotificationService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));
jest.mock('expo-device', () => ({ isDevice: false }));
jest.mock('../navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(), navigate: jest.fn() },
  navigateToTab: jest.fn(),
}));
jest.mock('../../features/auth/store/authStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));
jest.mock('../../features/medication/services/notificationVoiceData', () => ({
  extractVoiceUrl: jest.fn(() => null),
}));
jest.mock('../../features/medication/services/reminderVoicePlayer', () => ({
  playReminderVoice: jest.fn(),
}));

const mockNavigate = navigationRef.navigate as jest.Mock;
const mockIsReady = navigationRef.isReady as jest.Mock;
const mockNavigateToTab = navigateToTab as jest.Mock;
const mockGetAuthState = useAuthStore.getState as jest.Mock;

beforeEach(() => {
  mockIsReady.mockReturnValue(true);
  mockGetAuthState.mockReturnValue({ isAuthenticated: true });
  flushPendingDeepLink();
  jest.clearAllMocks();
  mockIsReady.mockReturnValue(true);
  mockGetAuthState.mockReturnValue({ isAuthenticated: true });
});

describe('Visit push navigation', () => {
  it.each([
    'VISIT_STREAK_REMINDER',
    'VISIT_CONFIRMED',
    'VISIT_BIRTHDAY_REMINDER',
    'VISIT_TET_REMINDER',
  ])('routes %s with an explicit elderly ID', (type) => {
    navigateFromPayload({ type, elderlyId: '17' });
    expect(mockNavigate).toHaveBeenCalledWith('FamilyVisitStreak', { elderlyId: '17' });
  });

  it('queues a valid cold-start Visit payload until navigation and auth are ready', () => {
    mockIsReady.mockReturnValue(false);
    navigateFromPayload({ type: 'VISIT_CONFIRMED', elderlyId: 17 });
    expect(mockNavigate).not.toHaveBeenCalled();

    mockIsReady.mockReturnValue(true);
    flushPendingDeepLink();

    expect(mockNavigate).toHaveBeenCalledWith('FamilyVisitStreak', { elderlyId: '17' });
  });

  it.each([undefined, 0, '0', 'bad', Number.NaN])('ignores invalid elderly ID %p', (elderlyId) => {
    navigateFromPayload({ type: 'VISIT_STREAK_REMINDER', elderlyId });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('existing push navigation', () => {
  it('preserves SOS, medication, health, and chat destinations', () => {
    navigateFromPayload({ type: 'SOS' });
    navigateFromPayload({ type: 'MEDICATION_REMINDER' });
    navigateFromPayload({ type: 'HEALTH_ALERT' });
    navigateFromPayload({ type: 'CHAT_REMINDER' });

    expect(mockNavigate).toHaveBeenCalledWith('FamilyAlerts');
    expect(mockNavigateToTab).toHaveBeenCalledWith('ElderlyShell', 'ElderlyMeds');
    expect(mockNavigate).toHaveBeenCalledWith('FamilyHealth');
    expect(mockNavigate).toHaveBeenCalledWith('ElderlyChat');
  });
});

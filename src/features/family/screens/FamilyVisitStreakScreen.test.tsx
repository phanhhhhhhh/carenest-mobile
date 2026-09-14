import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFeedStore } from '../store/feedStore';
import { useVisitStreakStore } from '../store/visitStreakStore';
import FamilyVisitStreakScreen from './FamilyVisitStreakScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
jest.mock('../store/visitStreakStore', () => ({
  useVisitStreakStore: jest.fn(),
}));
jest.mock('../store/feedStore', () => ({
  useFeedStore: jest.fn(),
}));

const TestRenderer = jest.requireActual('react-test-renderer');
const mockUseNavigation = useNavigation as jest.Mock;
const mockUseRoute = useRoute as jest.Mock;
const mockUseVisitStore = useVisitStreakStore as unknown as jest.Mock;
const mockUseFeedStore = useFeedStore as unknown as jest.Mock;

const load = jest.fn().mockResolvedValue(undefined);
const confirmVisit = jest.fn();
const updateSettings = jest.fn().mockResolvedValue(true);
const loadFeed = jest.fn().mockResolvedValue(undefined);
const goBack = jest.fn();

const disabledStreak = {
  elderlyId: 9,
  elderlyName: 'Parent A',
  enabled: false,
  cycleType: 'WEEKLY' as const,
  currentStreak: 2,
  longestStreak: 4,
  streakAtRisk: false,
  visitedThisCycle: false,
  recentVisits: [
    {
      id: 1,
      memberId: 3,
      memberName: 'Lan',
      visitedAt: '2026-09-10T10:00:00+07:00',
    },
  ],
};

let routeElderlyId = '9';
interface MockVisitState {
  byElderly: Record<string, typeof disabledStreak>;
  loadingByElderly: Record<string, boolean>;
  submittingByElderly: Record<string, boolean>;
  errorsByElderly: Record<string, string | null>;
  load: typeof load;
  confirmVisit: typeof confirmVisit;
  updateSettings: typeof updateSettings;
}

let visitState: MockVisitState = {
  byElderly: { '9': disabledStreak },
  loadingByElderly: {},
  submittingByElderly: {},
  errorsByElderly: {},
  load,
  confirmVisit,
  updateSettings,
};

function textContent(renderer: { root: { findAllByType: (type: typeof Text) => unknown[] } }) {
  return renderer.root
    .findAllByType(Text)
    .map((node: unknown) => (node as { props: { children?: unknown } }).props.children)
    .flat(Infinity)
    .join(' ');
}

function buttonByLabel(
  renderer: ReturnType<typeof TestRenderer.create>,
  label: string,
): {
  props: {
    onPress?: () => void;
    disabled?: boolean;
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
  };
} {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find((node: { props: { accessibilityLabel?: string } }) =>
      node.props.accessibilityLabel?.startsWith(label),
    );
  if (!button) throw new Error(`Button not found: ${label}`);
  return button;
}

beforeEach(() => {
  jest.clearAllMocks();
  routeElderlyId = '9';
  visitState = {
    byElderly: { '9': disabledStreak },
    loadingByElderly: {},
    submittingByElderly: {},
    errorsByElderly: {},
    load,
    confirmVisit,
    updateSettings,
  };
  updateSettings.mockResolvedValue(true);
  mockUseNavigation.mockReturnValue({ goBack });
  mockUseRoute.mockImplementation(() => ({ params: { elderlyId: routeElderlyId } }));
  mockUseVisitStore.mockImplementation((selector) => selector(visitState));
  mockUseFeedStore.mockImplementation((selector) => selector({ load: loadFeed }));
});

describe('FamilyVisitStreakScreen setup and routing', () => {
  it('loads only the route elderly ID and renders setup without enabling automatically', async () => {
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<FamilyVisitStreakScreen />);
    });

    expect(load).toHaveBeenCalledWith('9', expect.any(AbortSignal));
    expect(updateSettings).not.toHaveBeenCalled();
    expect(textContent(renderer!)).toContain('Parent A');
    expect(textContent(renderer!)).toContain('Lan');
    expect(buttonByLabel(renderer!, 'Bật nhắc').props.disabled).toBe(true);
  });

  it.each([
    ['Mỗi tuần', 'WEEKLY'],
    ['Mỗi tháng', 'MONTHLY'],
  ] as const)('sends one explicit setup PATCH after selecting %s', async (label, cycleType) => {
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<FamilyVisitStreakScreen />);
    });

    const cadence = buttonByLabel(renderer!, label);
    await TestRenderer.act(() => cadence.props.onPress?.());
    const enable = buttonByLabel(renderer!, 'Bật nhắc');
    expect(enable.props.disabled).toBe(false);
    await TestRenderer.act(async () => enable.props.onPress?.());

    expect(updateSettings).toHaveBeenCalledWith('9', { enabled: true, cycleType });
  });

  it('keeps cadence selected after failure and lets Để sau leave settings unchanged', async () => {
    updateSettings.mockResolvedValue(false);
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<FamilyVisitStreakScreen />);
    });

    await TestRenderer.act(() => buttonByLabel(renderer!, 'Mỗi tháng').props.onPress?.());
    await TestRenderer.act(async () => buttonByLabel(renderer!, 'Bật nhắc').props.onPress?.());
    expect(buttonByLabel(renderer!, 'Mỗi tháng').props.accessibilityState).toMatchObject({
      checked: true,
    });

    updateSettings.mockClear();
    await TestRenderer.act(() => buttonByLabel(renderer!, 'Để sau').props.onPress?.());
    expect(goBack).toHaveBeenCalled();
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('switches route profiles without showing the other profile state', async () => {
    visitState = {
      ...visitState,
      byElderly: {
        '9': disabledStreak,
        '10': { ...disabledStreak, elderlyId: 10, elderlyName: 'Parent B' },
      },
    };
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<FamilyVisitStreakScreen />);
    });

    routeElderlyId = '10';
    await TestRenderer.act(async () => {
      renderer!.update(<FamilyVisitStreakScreen />);
    });

    expect(textContent(renderer!)).toContain('Parent B');
    expect(textContent(renderer!)).not.toContain('Parent A');
    expect(load).toHaveBeenLastCalledWith('10', expect.any(AbortSignal));
  });

  it('shows a recoverable state for invalid stale route data', async () => {
    routeElderlyId = '0';
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<FamilyVisitStreakScreen />);
    });

    expect(textContent(renderer!)).toContain('Hồ sơ người cao tuổi không hợp lệ.');
    expect(buttonByLabel(renderer!, 'Quay lại')).toBeDefined();
  });
});

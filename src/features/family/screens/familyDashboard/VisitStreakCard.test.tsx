import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { parseStreak, type VisitStreak } from '../../store/visitStreakStore';
import { VisitStreakCard } from './VisitStreakCard';

const TestRenderer = jest.requireActual('react-test-renderer');

const baseStreak: VisitStreak = parseStreak({
  elderlyId: 1,
  elderlyName: 'Mẹ',
  enabled: true,
  cycleType: 'WEEKLY',
  currentStreak: 3,
  longestStreak: 5,
  cycleEndsAt: '2026-09-20T23:59:59+07:00',
  streakAtRisk: false,
  visitedThisCycle: false,
  recentVisits: [],
});

const callbacks = {
  onSetup: jest.fn(),
  onDetails: jest.fn(),
  onQuickConfirm: jest.fn(),
  onRetry: jest.fn(),
};

function textContent(renderer: { root: { findAllByType: (type: typeof Text) => unknown[] } }) {
  return renderer.root
    .findAllByType(Text)
    .map((node: unknown) => (node as { props: { children?: unknown } }).props.children)
    .flat(Infinity)
    .join(' ');
}

describe('VisitStreakCard', () => {
  it('renders loading and retry states without another profile streak', async () => {
    let loading: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(() => {
      loading = TestRenderer.create(
        <VisitStreakCard elderlyName="Parent B" submitting={false} error={null} {...callbacks} />,
      );
    });
    expect(textContent(loading!)).toContain('Nhịp về thăm nhà');
    expect(textContent(loading!)).not.toContain('3 tuần');

    await TestRenderer.act(() => {
      loading!.update(
        <VisitStreakCard
          elderlyName="Parent B"
          submitting={false}
          error="Offline"
          {...callbacks}
        />,
      );
    });
    const retry = loading!.root
      .findAllByType(TouchableOpacity)
      .find((node: { props: { accessibilityLabel?: string } }) =>
        node.props.accessibilityLabel?.startsWith('Thử tải lại'),
      );
    expect(retry).toBeDefined();
  });

  it('renders setup action for disabled reminders and supports a long name', async () => {
    let renderer: ReturnType<typeof TestRenderer.create>;
    const longName = 'Bà Nguyễn Thị Minh Anh Và Gia Đình';
    await TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <VisitStreakCard
          elderlyName={longName}
          streak={{ ...baseStreak, enabled: false, elderlyName: longName }}
          submitting={false}
          error={null}
          {...callbacks}
        />,
      );
    });

    expect(textContent(renderer!)).toContain(longName);
    const setup = renderer!.root
      .findAllByType(TouchableOpacity)
      .find(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === 'Thiết lập Nhịp về thăm',
      );
    expect(setup?.props.accessibilityRole).toBe('button');
  });

  it('uses neutral and reminder copy, then positive completed copy', async () => {
    let renderer: ReturnType<typeof TestRenderer.create>;
    await TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <VisitStreakCard
          elderlyName="Mẹ"
          streak={{ ...baseStreak, streakAtRisk: true }}
          submitting={false}
          error={null}
          {...callbacks}
        />,
      );
    });
    expect(textContent(renderer!)).toContain('Chu kỳ này chưa có lượt thăm.');
    expect(textContent(renderer!)).toContain('Nếu thuận tiện');

    await TestRenderer.act(() => {
      renderer!.update(
        <VisitStreakCard
          elderlyName="Mẹ"
          streak={{ ...baseStreak, visitedThisCycle: true }}
          submitting={false}
          error={null}
          {...callbacks}
        />,
      );
    });
    expect(textContent(renderer!)).toContain('Chu kỳ này đã có người về thăm.');
  });
});

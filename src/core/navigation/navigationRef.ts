import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

/**
 * Module-level navigation ref — RN equivalent of the GlobalKey<NavigatorState>
 * that Flutter's FcmService used to navigate from outside the widget tree.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigate to a nested tab inside a shell, safely (no-op if not ready). */
export function navigateToTab(shell: 'ElderlyShell' | 'FamilyShell', tab: string): void {
  if (!navigationRef.isReady()) return;
  // @ts-expect-error — nested navigator params are not modeled in RootStackParamList
  navigationRef.navigate(shell, { screen: tab });
}

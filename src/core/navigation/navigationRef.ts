import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';
import type { ElderlyTabParamList } from './ElderlyShell';
import type { FamilyTabParamList } from './FamilyShell';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToTab(shell: 'ElderlyShell', tab: keyof ElderlyTabParamList): void;
export function navigateToTab(shell: 'FamilyShell', tab: keyof FamilyTabParamList): void;
export function navigateToTab(
  shell: 'ElderlyShell' | 'FamilyShell',
  tab: keyof ElderlyTabParamList | keyof FamilyTabParamList,
): void {
  if (!navigationRef.isReady()) return;
  if (shell === 'ElderlyShell') {
    navigationRef.navigate('ElderlyShell', { screen: tab as keyof ElderlyTabParamList });
  } else {
    navigationRef.navigate('FamilyShell', { screen: tab as keyof FamilyTabParamList });
  }
}

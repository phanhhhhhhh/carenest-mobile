import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';


export const navigationRef = createNavigationContainerRef<RootStackParamList>();


export function navigateToTab(shell: 'ElderlyShell' | 'FamilyShell', tab: string): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(shell, { screen: tab });
}

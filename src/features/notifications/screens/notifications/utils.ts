import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../core/navigation/AppNavigator';
import { Colors } from '../../../../core/theme/colors';

export type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Where tapping a notification of this type should land, per the current user's role. */
export function routeForNotification(
  type: string,
  role: string | undefined,
  navigation: Nav,
): void {
  const isFamily = role === 'FAMILY';
  switch (type) {
    case 'EMERGENCY':
      if (isFamily) navigation.navigate('FamilyAlerts');
      break;
    case 'HEALTH_ALERT':
      if (isFamily) navigation.navigate('FamilyHealth');
      else navigation.navigate('ElderlyHealth');
      break;
    case 'MEDICATION_REMINDER':
      if (isFamily) navigation.navigate('FamilyShell', { screen: 'FamilyMeds' });
      else navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' });
      break;
    case 'APPOINTMENT_REMINDER':
      if (isFamily) navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' });
      else navigation.navigate('ElderlyAppointments');
      break;
    default:
      break;
  }
}

export function formatTime(createdAt: string): string {
  const dt = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  const hh = dt.getHours();
  const mm = dt.getMinutes().toString().padStart(2, '0');
  if (diffDays === 0) return `Hôm nay ${hh}:${mm}`;
  if (diffDays === 1) return `Hôm qua ${hh}:${mm}`;
  return `${diffDays} ngày trước`;
}

export function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'EMERGENCY':
      return 'alert-circle';
    case 'MEDICATION_REMINDER':
      return 'medkit';
    case 'HEALTH_ALERT':
      return 'warning';
    case 'FAMILY_LINK_REQUEST':
    case 'FAMILY_UPDATE':
      return 'people';
    default:
      return 'notifications';
  }
}

export function colorForType(type: string): string {
  switch (type) {
    case 'EMERGENCY':
      return Colors.error;
    case 'MEDICATION_REMINDER':
      return Colors.warning;
    case 'HEALTH_ALERT':
      return Colors.error;
    case 'FAMILY_LINK_REQUEST':
    case 'FAMILY_UPDATE':
      return Colors.primary;
    default:
      return Colors.textSecondary;
  }
}

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

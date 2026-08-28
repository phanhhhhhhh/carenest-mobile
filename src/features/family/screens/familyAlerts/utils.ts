import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function eventTitle(type: string): string {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return 'Khẩn cấp SOS';
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return 'Bỏ lỡ uống thuốc';
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return 'Chỉ số sức khỏe bất thường';
    default:
      return 'Cảnh báo';
  }
}

export function eventIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return 'alert-circle';
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return 'medkit';
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return 'warning';
    default:
      return 'notifications';
  }
}

export function eventColor(type: string): string {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return Colors.sosPrimary;
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return Colors.warning;
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return Colors.error;
    default:
      return Colors.primary;
  }
}

export function formatRelative(createdAt: string): string {
  const dt = new Date(createdAt);
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(dt).getTime()) / (24 * 60 * 60 * 1000),
  );

  const hh = dt.getHours();
  const mm = String(dt.getMinutes()).padStart(2, '0');

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  if (diffDays === 0) return `Hôm nay ${hh}:${mm}`;
  if (diffDays === 1) return `Hôm qua ${hh}:${mm}`;
  return `${diffDays} ngày trước`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

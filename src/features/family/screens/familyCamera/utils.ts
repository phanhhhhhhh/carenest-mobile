import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function triggerLabel(trigger: string): string {
  switch (trigger) {
    case 'SOS':
      return 'Ảnh chụp khẩn cấp SOS';
    case 'CHECK_IN':
      return 'Kiểm tra định kỳ';
    case 'MOTION':
      return 'Phát hiện chuyển động';
    default:
      return 'Ảnh chụp';
  }
}

export function triggerIcon(trigger: string): keyof typeof Ionicons.glyphMap {
  switch (trigger) {
    case 'SOS':
      return 'warning-outline';
    case 'CHECK_IN':
      return 'time-outline';
    case 'MOTION':
      return 'walk-outline';
    default:
      return 'camera';
  }
}

export function triggerColor(trigger: string): string {
  switch (trigger) {
    case 'SOS':
      return Colors.sosPrimary;
    case 'CHECK_IN':
      return Colors.primary;
    case 'MOTION':
      return Colors.warning;
    default:
      return Colors.textSecondary;
  }
}

export function formatTime(iso: string): string {
  const dt = new Date(iso);
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const isSameDay = dt.toDateString() === new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = dt.toDateString() === yesterday.toDateString();
  if (isSameDay) return `Hôm nay ${dt.getHours()}:${pad(dt.getMinutes())}`;
  if (isYesterday) return `Hôm qua ${dt.getHours()}:${pad(dt.getMinutes())}`;
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

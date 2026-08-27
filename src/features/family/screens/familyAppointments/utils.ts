import { Colors } from '../../../../core/theme/colors';

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp tới',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  RESCHEDULED: 'Đã dời lịch',
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.primary,
  COMPLETED: Colors.success,
  CANCELLED: Colors.error,
  RESCHEDULED: Colors.warning,
};

export const MONTHS = [
  'Th1',
  'Th2',
  'Th3',
  'Th4',
  'Th5',
  'Th6',
  'Th7',
  'Th8',
  'Th9',
  'Th10',
  'Th11',
  'Th12',
];

export const WEEK_DAYS = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? Colors.textHint;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatDate(dt: Date): string {
  const weekdayIdx = (dt.getDay() + 6) % 7;
  return `${WEEK_DAYS[weekdayIdx]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function formatTime(dt: Date): string {
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

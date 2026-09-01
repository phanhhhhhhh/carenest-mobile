import { Colors } from '../../../../core/theme/colors';

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp tới',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  RESCHEDULED: 'Đã đổi lịch',
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.primary,
  COMPLETED: Colors.success,
  CANCELLED: Colors.error,
  RESCHEDULED: Colors.warning,
};

const MONTHS = [
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
const WEEK_DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

export function formatDate(iso: string): string {
  const dt = new Date(iso);
  const weekdayIdx = (dt.getDay() + 6) % 7;
  return `${WEEK_DAYS[weekdayIdx]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

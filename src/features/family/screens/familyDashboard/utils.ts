import type { MedicationItem } from '../../../../shared/types';

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

export function formatRelative(iso: string): string {
  const dt = new Date(iso);
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(dt).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
}

export function formatDoseTime(med: MedicationItem): string {
  if (med.nextDoseTime) {
    const d = new Date(med.nextDoseTime);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return med.scheduleTimes.length > 0 ? med.scheduleTimes[0] : '';
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

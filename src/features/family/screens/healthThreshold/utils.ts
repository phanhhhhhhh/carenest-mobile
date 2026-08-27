import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export const METRIC_TYPES = ['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE', 'WEIGHT'] as const;

export function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return 'heart';
    case 'BLOOD_GLUCOSE':
      return 'water';
    case 'HEART_RATE':
      return 'pulse';
    case 'WEIGHT':
      return 'speedometer';
    default:
      return 'medkit';
  }
}

export function colorFor(type: string): string {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return Colors.error;
    case 'BLOOD_GLUCOSE':
      return '#1565C0';
    case 'HEART_RATE':
      return Colors.secondary;
    case 'WEIGHT':
      return Colors.warning;
    default:
      return Colors.primary;
  }
}

export function parseNum(s: string): number | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

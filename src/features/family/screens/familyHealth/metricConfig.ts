import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export const METRIC_ORDER = ['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE', 'WEIGHT'] as const;

export interface MetricDef {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unit: string;
}

export const METRIC_DEFS: Record<string, MetricDef> = {
  BLOOD_PRESSURE: { title: 'Huyết áp', icon: 'heart', color: Colors.error, unit: 'mmHg' },
  BLOOD_GLUCOSE: { title: 'Đường huyết', icon: 'water', color: '#1565C0', unit: 'mmol/L' },
  HEART_RATE: { title: 'Nhịp tim', icon: 'pulse', color: Colors.secondary, unit: 'bpm' },
  WEIGHT: { title: 'Cân nặng', icon: 'speedometer', color: Colors.warning, unit: 'kg' },
};

export interface Status {
  label: string;
  color: string;
}

export function formatTime(iso: string): string {
  const dt = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()) /
      86400000,
  );

  if (diffMin < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMin} phút trước`;
  if (diffDays === 0) return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 1) return 'Hôm qua';
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

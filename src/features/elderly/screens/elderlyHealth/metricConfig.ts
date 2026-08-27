import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { HealthMetric } from '../../../../shared/types';

export interface MetricConfig {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgColor: string;
  unit: string;
  normalRange?: [number, number];
}

export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  BLOOD_PRESSURE: {
    label: 'Huyết áp',
    icon: 'heart',
    color: Colors.error,
    bgColor: '#FFEBEE',
    unit: 'mmHg',
    normalRange: [90, 140],
  },
  BLOOD_GLUCOSE: {
    label: 'Đường huyết',
    icon: 'water',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    unit: 'mmol/L',
    normalRange: [3.9, 6.7],
  },
  HEART_RATE: {
    label: 'Nhịp tim',
    icon: 'pulse',
    color: Colors.secondary,
    bgColor: '#E8F5E9',
    unit: 'bpm',
    normalRange: [60, 100],
  },
  WEIGHT: {
    label: 'Cân nặng',
    icon: 'barbell',
    color: Colors.warning,
    bgColor: '#FFF3E0',
    unit: 'kg',
  },
};

export const METRIC_KEYS = Object.keys(METRIC_CONFIGS);

export type Status = 'high' | 'low' | 'normal' | 'none';

export type ThresholdLookup = (type: string) => {
  minValue?: number | null;
  maxValue?: number | null;
} | null;

/**
 * Prefers a family-configured threshold for the metric type; falls back to the
 * built-in normal range in METRIC_CONFIGS.
 */
export function computeStatus(
  data: HealthMetric,
  elderlyId: string,
  findThresholdFor: ThresholdLookup,
): Status {
  if (elderlyId) {
    const threshold = findThresholdFor(data.type);
    if (threshold) {
      const val = Number.parseFloat(data.value);
      if (!Number.isNaN(val)) {
        if (threshold.minValue != null && val < threshold.minValue) return 'low';
        if (threshold.maxValue != null && val > threshold.maxValue) return 'high';
        return 'normal';
      }
    }
  }
  const config = METRIC_CONFIGS[data.type];
  if (!config || !config.normalRange) return 'normal';
  const val = Number.parseFloat(data.value);
  if (Number.isNaN(val)) return 'normal';
  if (val > config.normalRange[1]) return 'high';
  if (val < config.normalRange[0]) return 'low';
  return 'normal';
}

export function statusLabel(status: Status): string {
  switch (status) {
    case 'high':
      return 'Cao';
    case 'low':
      return 'Thấp';
    case 'normal':
      return 'Bình thường';
    default:
      return '';
  }
}

export function statusColor(status: Status): string {
  switch (status) {
    case 'high':
      return Colors.error;
    case 'low':
      return Colors.warning;
    case 'normal':
      return Colors.success;
    default:
      return Colors.textHint;
  }
}

export function formatTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  if (diffDays === 0) {
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

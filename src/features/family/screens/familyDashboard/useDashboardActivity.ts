import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme';
import type { EmergencyEvent, HealthMetric, MedicationItem } from '../../../../shared/types';
import { formatDoseTime, formatRelative } from './utils';

export type ActivityItem = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string;
};

interface Params {
  elderlyId: string | null;
  alertEvents: EmergencyEvent[];
  alertLoading: boolean;
  medItems: MedicationItem[];
  medLoading: boolean;
  latestByType: Record<string, HealthMetric>;
  healthLoading: boolean;
}

/**
 * Builds up to 3 "recent activity" rows, preferring active alerts, then
 * recently-taken meds, then latest vitals. Falls back to an "all clear" row.
 */
export function useDashboardActivity({
  elderlyId,
  alertEvents,
  alertLoading,
  medItems,
  medLoading,
  latestByType,
  healthLoading,
}: Params): ActivityItem[] {
  return useMemo(() => {
    const items: ActivityItem[] = [];

    if (elderlyId) {
      if (!alertLoading && alertEvents.length > 0) {
        const active = alertEvents.filter((e) => e.status === 'ACTIVE').slice(0, 2);
        for (const event of active) {
          items.push({
            icon: 'warning',
            color: Colors.error,
            title: event.type === 'SOS' ? 'Cảnh báo khẩn cấp (SOS)' : 'Cảnh báo',
            subtitle: event.description,
            time: formatRelative(event.createdAt),
          });
        }
      }
      if (!medLoading && medItems.length > 0 && items.length < 3) {
        const takenRecently = medItems.filter((m) => m.taken).slice(0, 3 - items.length);
        for (const med of takenRecently) {
          items.push({
            icon: 'medical',
            color: Colors.success,
            title: `Đã uống ${med.name}`,
            subtitle: med.dosage,
            time: formatDoseTime(med) ? `Lúc ${formatDoseTime(med)}` : '',
          });
        }
      }
      if (!healthLoading && Object.keys(latestByType).length > 0 && items.length < 3) {
        const entries = Object.entries(latestByType).slice(0, 3 - items.length);
        for (const [type, data] of entries) {
          const typeLabel =
            type === 'BLOOD_PRESSURE'
              ? 'Huyết áp'
              : type === 'BLOOD_GLUCOSE'
                ? 'Đường huyết'
                : type === 'HEART_RATE'
                  ? 'Nhịp tim'
                  : type;
          const valueStr = data.valueSecondary
            ? `${data.value}/${data.valueSecondary}`
            : data.value;
          items.push({
            icon: 'pulse',
            color: Colors.primary,
            title: `Đo ${typeLabel}`,
            subtitle: `${valueStr} ${data.unit ?? ''}`.trim(),
            time: formatRelative(data.recordedAt),
          });
        }
      }
    }

    if (items.length === 0) {
      items.push({
        icon: 'checkmark-circle-outline',
        color: Colors.textHint,
        title: 'Chưa có cảnh báo nào',
        subtitle: 'Mọi thứ đang ổn',
        time: '',
      });
    }

    return items;
  }, [elderlyId, alertEvents, alertLoading, medItems, medLoading, latestByType, healthLoading]);
}

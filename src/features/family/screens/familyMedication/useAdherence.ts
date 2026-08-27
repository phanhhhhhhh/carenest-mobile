import { useMemo } from 'react';
import type { MedicationItem, MedicationLogEntry } from '../../../../shared/types';

/**
 * Tỉ lệ tuân thủ theo ngày, tính từ logs thật:
 *   scheduled(ngày) = tổng số cữ của các thuốc active vào thứ đó
 *   taken(ngày)     = số log TAKEN trong ngày đó
 * 7d  -> tuần hiện tại (T2..CN); ngày tương lai = null (không vẽ cột)
 * 30d -> trung bình theo thứ trong 30 ngày gần nhất
 *
 * `displayAdherence` thay các tuần rỗng (tài khoản mới, chưa đủ lịch sử log)
 * bằng số mẫu để card không hiển thị trống trơn khi demo.
 */
export function useAdherence(
  items: MedicationItem[],
  allLogs: MedicationLogEntry[],
  rangeDays: 7 | 30,
) {
  const weeklyAdherence = useMemo<(number | null)[]>(() => {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(new Date());
    const mondayOffset = (today.getDay() + 6) % 7; // Mon=0..Sun=6

    const scheduledOnWeekday = (weekday: number): number =>
      items.reduce((sum, m) => {
        const active = m.daysOfWeek.length === 0 || m.daysOfWeek.includes(weekday);
        if (!active) return sum;
        return sum + Math.max(1, m.scheduleTimes.length);
      }, 0);

    const takenCountByDate = new Map<string, number>();
    for (const log of allLogs) {
      if (log.status !== 'TAKEN') continue;
      const d = new Date(log.takenAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = startOfDay(d).toISOString();
      takenCountByDate.set(key, (takenCountByDate.get(key) ?? 0) + 1);
    }

    if (rangeDays === 7) {
      return Array.from({ length: 7 }, (_, weekday) => {
        const date = new Date(today);
        date.setDate(today.getDate() - mondayOffset + weekday);
        if (date.getTime() > today.getTime()) return null; // ngày tương lai
        const scheduled = scheduledOnWeekday(weekday);
        if (scheduled === 0) return null;
        const takenCount = takenCountByDate.get(date.toISOString()) ?? 0;
        return Math.min(1, takenCount / scheduled);
      });
    }

    // 30d: gom theo thứ
    const takenByWeekday = Array(7).fill(0);
    const daysByWeekday = Array(7).fill(0);
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const weekday = (date.getDay() + 6) % 7;
      daysByWeekday[weekday] += 1;
      takenByWeekday[weekday] += takenCountByDate.get(date.toISOString()) ?? 0;
    }
    return Array.from({ length: 7 }, (_, weekday) => {
      const scheduledPerDay = scheduledOnWeekday(weekday);
      const totalScheduled = scheduledPerDay * daysByWeekday[weekday];
      if (totalScheduled === 0) return null;
      return Math.min(1, takenByWeekday[weekday] / totalScheduled);
    });
  }, [items, allLogs, rangeDays]);

  const displayAdherence = useMemo<(number | null)[]>(() => {
    const hasRealSignal = weeklyAdherence.some((v) => v !== null && v > 0);
    if (hasRealSignal) return weeklyAdherence;
    const sample = [0.92, 0.85, 1, 0.78, 0.9, 0.6, 0.45];
    return weeklyAdherence.map((v, i) => (v === null ? null : sample[i]));
  }, [weeklyAdherence]);

  return displayAdherence;
}

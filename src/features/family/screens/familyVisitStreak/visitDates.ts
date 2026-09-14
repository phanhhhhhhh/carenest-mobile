const ICT_OFFSET_HOURS = 7;
const ICT_OFFSET_MS = ICT_OFFSET_HOURS * 60 * 60 * 1000;

export interface VisitDateOption {
  daysAgo: number;
  label: string;
  dateLabel: string;
  visitedAt: string;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/** Creates Today plus seven previous ICT calendar dates without using the device timezone. */
export function createVisitDateOptions(now = new Date()): VisitDateOption[] {
  const ictClock = new Date(now.getTime() + ICT_OFFSET_MS);
  const hour = ictClock.getUTCHours();
  const minute = ictClock.getUTCMinutes();
  const second = ictClock.getUTCSeconds();

  return Array.from({ length: 8 }, (_, daysAgo) => {
    const calendarDate = new Date(
      Date.UTC(ictClock.getUTCFullYear(), ictClock.getUTCMonth(), ictClock.getUTCDate() - daysAgo),
    );
    const year = calendarDate.getUTCFullYear();
    const month = calendarDate.getUTCMonth() + 1;
    const day = calendarDate.getUTCDate();
    const dateLabel = `${twoDigits(day)}/${twoDigits(month)}/${year}`;
    const label = daysAgo === 0 ? 'Hôm nay' : daysAgo === 1 ? 'Hôm qua' : dateLabel;

    return {
      daysAgo,
      label,
      dateLabel,
      visitedAt: `${year}-${twoDigits(month)}-${twoDigits(day)}T${twoDigits(hour)}:${twoDigits(
        minute,
      )}:${twoDigits(second)}+07:00`,
    };
  });
}

export function formatVisitDate(iso?: string, includeTime = false): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

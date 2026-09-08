/** Pure display helpers for the ADMIN payments screen. */

const PLAN_LABELS: Record<string, string> = {
  PREMIUM_MONTHLY: 'Premium Hàng tháng',
  PREMIUM_YEARLY: 'Premium Hàng năm',
  PRO_MONTHLY: 'Pro Hàng tháng',
  PRO_YEARLY: 'Pro Hàng năm',
  FREE: 'Miễn phí',
};

export function planLabel(planType: string): string {
  return PLAN_LABELS[planType] ?? planType;
}

/** `49000` -> `49.000đ`. Falls back to a bare number for anything unparseable. */
export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount)) return '0đ';
  return `${Math.trunc(amount).toLocaleString('vi-VN')}đ`;
}

/** Coarse "how long ago" label in Vietnamese; `now` is injectable for tests. */
export function timeAgo(iso: string | undefined, now: number = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(0, Math.floor((now - then) / 60000));
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

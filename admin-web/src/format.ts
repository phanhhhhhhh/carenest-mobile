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

export function formatVnd(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `${Math.trunc(amount).toLocaleString('vi-VN')} ₫`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

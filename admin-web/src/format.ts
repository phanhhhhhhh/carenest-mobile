const PLAN_LABELS: Record<string, string> = {
  PREMIUM_MONTHLY: 'Premium Hàng tháng',
  PREMIUM_YEARLY: 'Premium Hàng năm',
  PRO_MONTHLY: 'Pro Hàng tháng',
  PRO_YEARLY: 'Pro Hàng năm',
  FREE: 'Miễn phí',
};

const ROLE_LABELS: Record<string, string> = {
  ELDERLY: 'Người cao tuổi',
  FAMILY: 'Người thân',
  ADMIN: 'Quản trị',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ duyệt',
  CANCELLED: 'Đã huỷ',
  EXPIRED: 'Hết hạn',
};

export function planLabel(planType: string): string {
  return PLAN_LABELS[planType] ?? planType;
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `${Math.trunc(amount).toLocaleString('vi-VN')} ₫`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN');
}

export function formatDateTime(iso: string | null | undefined): string {
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

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

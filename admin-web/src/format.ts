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

const METRIC_LABELS: Record<string, string> = {
  BLOOD_PRESSURE: 'Huyết áp',
  HEART_RATE: 'Nhịp tim',
  BLOOD_GLUCOSE: 'Đường huyết',
  WEIGHT: 'Cân nặng',
  TEMPERATURE: 'Nhiệt độ',
  SPO2: 'SpO₂',
};

const NOTIF_LABELS: Record<string, string> = {
  MEDICATION_REMINDER: 'Nhắc thuốc',
  HEALTH_ALERT: 'Cảnh báo sức khỏe',
  EMERGENCY: 'Khẩn cấp',
  APPOINTMENT_REMINDER: 'Nhắc lịch hẹn',
  FAMILY_UPDATE: 'Cập nhật gia đình',
  FAMILY_LINK_REQUEST: 'Yêu cầu kết nối',
  WEEKLY_SUMMARY: 'Tổng kết tuần',
};

const APPT_LABELS: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  MISSED: 'Bỏ lỡ',
};

const EMERGENCY_LABELS: Record<string, string> = {
  ACTIVE: 'Đang mở',
  RESOLVED: 'Đã xử lý',
  FALSE_ALARM: 'Báo nhầm',
  CANCELLED: 'Đã huỷ',
};

const CONSENT_LABELS: Record<string, string> = {
  PENDING: 'Chưa quyết định',
  ACCEPTED: 'Đồng ý',
  DECLINED: 'Từ chối',
};

const MOOD = ['', '😊 Vui', '😐 Bình thường', '😟 Không khỏe'];

export function planLabel(planType: string): string {
  return PLAN_LABELS[planType] ?? planType;
}

export function metricLabel(t: string | null): string {
  return t ? (METRIC_LABELS[t] ?? t) : '—';
}
export function notifLabel(t: string | null): string {
  return t ? (NOTIF_LABELS[t] ?? t) : '—';
}
export function apptLabel(s: string | null): string {
  return s ? (APPT_LABELS[s] ?? s) : '—';
}
export function emergencyLabel(s: string | null): string {
  return s ? (EMERGENCY_LABELS[s] ?? s) : '—';
}
export function consentLabel(s: string | null): string {
  return s ? (CONSENT_LABELS[s] ?? s) : '—';
}
export function moodLabel(m: number | null): string {
  return m != null && m >= 1 && m <= 3 ? MOOD[m] : '—';
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

import type {
  ActionResult,
  AdminAppointmentRow,
  AdminCameraRow,
  AdminCheckInRow,
  AdminElderlyRow,
  AdminEmergencyRow,
  AdminFamilyLinkRow,
  AdminHealthMetricRow,
  AdminMedicationRow,
  AdminNotificationRow,
  AdminSubscriptionRow,
  AdminUserDetail,
  AdminUserRow,
  AuthResponse,
  Overview,
  Page,
  PendingPayment,
} from './types';

const TOKEN_KEY = 'carenest_admin_token';
const USER_KEY = 'carenest_admin_user';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): { id: number; name: string; role: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface RequestOptions extends RequestInit {
  /** Skip the stored Bearer token (used for /auth/login). */
  anonymous?: boolean;
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.message === 'string' && b.message) return b.message;
    if (typeof b.error === 'string' && b.error) return b.error;
  }
  return fallback;
}

async function request<T>(path: string, { anonymous, ...init }: RequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token && !anonymous) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới máy chủ. Kiểm tra backend đang chạy.');
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (res.ok) return body as T;

  // On an authenticated call, 401/403 means the session is stale — drop it so the
  // app returns to the login screen. On /auth/login itself, surface the server message.
  if (!anonymous && (res.status === 401 || res.status === 403)) {
    clearSession();
    throw new ApiError(res.status, 'Phiên đăng nhập đã hết hạn hoặc không đủ quyền. Đăng nhập lại.');
  }
  if (res.status === 429) {
    throw new ApiError(429, messageFrom(body, 'Thử lại sau ít phút (quá nhiều lần thử).'));
  }
  throw new ApiError(res.status, messageFrom(body, `Lỗi máy chủ (${res.status})`));
}

export async function login(phone: string, password: string): Promise<AuthResponse> {
  // Clear any stale session first so a leftover token can't ride along on the request.
  clearSession();
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify({ phone: phone.trim(), password }),
  });
  if (!res.accessToken) throw new ApiError(500, 'Máy chủ không trả về token.');
  if (res.user?.role !== 'ADMIN') {
    throw new ApiError(403, `Tài khoản này có vai trò ${res.user?.role ?? '?'}, không phải ADMIN.`);
  }
  localStorage.setItem(TOKEN_KEY, res.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  return res;
}

export function getOverview(): Promise<Overview> {
  return request<Overview>('/admin/overview');
}

export function getUsers(params: {
  role?: string;
  query?: string;
  page?: number;
  size?: number;
}): Promise<Page<AdminUserRow>> {
  const q = new URLSearchParams();
  if (params.role) q.set('role', params.role);
  if (params.query) q.set('query', params.query);
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 25));
  return request<Page<AdminUserRow>>(`/admin/users?${q}`);
}

/** Shared query builder for the paginated admin list endpoints. */
function listQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  if (!q.has('page')) q.set('page', '0');
  return q.toString();
}

export function getSubscriptions(p: {
  status?: string;
  page?: number;
}): Promise<Page<AdminSubscriptionRow>> {
  return request(`/admin/subscriptions?${listQuery(p)}`);
}

export function getElderly(p: { page?: number }): Promise<Page<AdminElderlyRow>> {
  return request(`/admin/elderly?${listQuery(p)}`);
}

export function getFamilyLinks(p: {
  status?: string;
  page?: number;
}): Promise<Page<AdminFamilyLinkRow>> {
  return request(`/admin/family-links?${listQuery(p)}`);
}

export function getEmergencies(p: {
  status?: string;
  page?: number;
}): Promise<Page<AdminEmergencyRow>> {
  return request(`/admin/emergencies?${listQuery(p)}`);
}

export function getCheckIns(p: { page?: number }): Promise<Page<AdminCheckInRow>> {
  return request(`/admin/check-ins?${listQuery(p)}`);
}

export function getMedications(p: { page?: number }): Promise<Page<AdminMedicationRow>> {
  return request(`/admin/medications?${listQuery(p)}`);
}

export function getHealthMetrics(p: {
  type?: string;
  page?: number;
}): Promise<Page<AdminHealthMetricRow>> {
  return request(`/admin/health-metrics?${listQuery(p)}`);
}

export function getCameras(p: { page?: number }): Promise<Page<AdminCameraRow>> {
  return request(`/admin/cameras?${listQuery(p)}`);
}

export function getNotifications(p: {
  type?: string;
  page?: number;
}): Promise<Page<AdminNotificationRow>> {
  return request(`/admin/notifications?${listQuery(p)}`);
}

export function getAppointments(p: {
  status?: string;
  page?: number;
}): Promise<Page<AdminAppointmentRow>> {
  return request(`/admin/appointments?${listQuery(p)}`);
}

export function getUserDetail(id: number): Promise<AdminUserDetail> {
  return request(`/admin/users/${id}`);
}

export function getPendingPayments(): Promise<PendingPayment[]> {
  return request<PendingPayment[]>('/payment/pending');
}

export function confirmPayment(transactionId: string): Promise<ActionResult> {
  return request<ActionResult>('/payment/vietqr/confirm', {
    method: 'POST',
    body: JSON.stringify({ transactionId }),
  });
}

export function rejectPayment(transactionId: string): Promise<ActionResult> {
  return request<ActionResult>('/payment/vietqr/reject', {
    method: 'POST',
    body: JSON.stringify({ transactionId }),
  });
}

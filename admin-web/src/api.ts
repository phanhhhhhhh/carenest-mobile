import type { ActionResult, AuthResponse, PendingPayment } from './types';

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới máy chủ. Kiểm tra backend đang chạy.');
  }

  if (res.status === 401) {
    clearSession();
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  if (res.status === 403) {
    throw new ApiError(403, 'Tài khoản này không có quyền ADMIN.');
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      `Lỗi máy chủ (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export async function login(phone: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: phone.trim(), password }),
  });
  if (!res.accessToken) throw new ApiError(500, 'Máy chủ không trả về token.');
  if (res.user?.role !== 'ADMIN') {
    throw new ApiError(403, 'Tài khoản này không phải ADMIN.');
  }
  localStorage.setItem(TOKEN_KEY, res.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  return res;
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

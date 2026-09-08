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

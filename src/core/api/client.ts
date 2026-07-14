import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getToken, getRefreshToken, saveToken, saveRefreshToken, clearAll,
  saveRole, saveName, saveUserId, savePhone, saveEmail,
} from '../storage/secureStorage';
import { AppConfig } from '../config/appConfig';
import { emitSessionExpired } from '../auth/sessionEvents';

const BASE_URL = AppConfig.apiBaseUrl;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ── Proactive refresh helpers ────────────────────────────────────
const PROACTIVE_REFRESH_WINDOW_SEC = 60;
let pendingRefresh: Promise<string | null> | null = null;

function jwtExpiresSoon(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    const remaining = payload.exp * 1000 - Date.now();
    return remaining / 1000 < PROACTIVE_REFRESH_WINDOW_SEC;
  } catch {
    return false;
  }
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    const newAccess = res.data.accessToken;
    const newRefresh = res.data.refreshToken;
    await saveToken(newAccess);
    await saveRefreshToken(newRefresh);

    // Also refresh persisted user data on token refresh (parity with dio_client)
    const user = res.data.user;
    if (user) {
      if (user.role) await saveRole(user.role);
      if (user.name) await saveName(user.name);
      if (user.id != null) await saveUserId(String(user.id));
      if (user.phone) await savePhone(user.phone);
      if (user.email) await saveEmail(user.email);
    }

    return newAccess;
  } catch {
    return null;
  }
}

// ── Request interceptor ──────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isRefreshPath = config.url?.includes('/auth/refresh');

  if (!isRefreshPath) {
    const token = await getToken();
    if (token) {
      // Proactive refresh if token expires soon
      if (jwtExpiresSoon(token)) {
        pendingRefresh ??= doRefresh();
        const newToken = await pendingRefresh;
        pendingRefresh = null;
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor — 401 retry with refresh ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const is401 = error.response?.status === 401;
    const isRefreshPath = originalRequest.url?.includes('/auth/refresh');

    if (is401 && !isRefreshPath && !originalRequest._retry) {
      try {
        pendingRefresh ??= doRefresh();
        const newToken = await pendingRefresh;
        pendingRefresh = null;

        if (!newToken) {
          await clearAll();
          emitSessionExpired();
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        pendingRefresh = null;
        await clearAll();
        emitSessionExpired();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

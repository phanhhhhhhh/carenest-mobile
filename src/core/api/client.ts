import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getToken, getRefreshToken, saveToken, saveRefreshToken, clearAll,
  saveRole, saveName, saveUserId, savePhone, saveEmail,
} from '../storage/secureStorage';
import { AppConfig } from '../config/appConfig';
import { emitSessionExpired } from '../auth/sessionEvents';
import { jwtSecondsRemaining } from '../auth/jwt';
import { isNetworkError } from './errors';
import { showErrorToast } from '../../shared/components/toastStore';

const BASE_URL = AppConfig.apiBaseUrl;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const PROACTIVE_REFRESH_WINDOW_SEC = 60;
let pendingRefresh: Promise<string | null> | null = null;

function jwtExpiresSoon(token: string): boolean {
  const remaining = jwtSecondsRemaining(token);
  // Unreadable token: don't proactively refresh — let the request go out as-is.
  if (remaining == null) return false;
  return remaining < PROACTIVE_REFRESH_WINDOW_SEC;
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

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isRefreshPath = config.url?.includes('/auth/refresh');

  if (!isRefreshPath) {
    const token = await getToken();
    if (token) {
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

const NETWORK_TOAST_COOLDOWN_MS = 5000;
let lastNetworkToastAt = 0;

function notifyIfUnreachable(error: AxiosError): void {
  if (!isNetworkError(error)) return;
  const now = Date.now();
  if (now - lastNetworkToastAt < NETWORK_TOAST_COOLDOWN_MS) return;
  lastNetworkToastAt = now;
  showErrorToast('Không có kết nối — vui lòng kiểm tra mạng và thử lại.');
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    notifyIfUnreachable(error);

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

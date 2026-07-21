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

const PROACTIVE_REFRESH_WINDOW_SEC = 60;
let pendingRefresh: Promise<string | null> | null = null;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Hermes doesn't reliably provide a global `atob`/`Buffer`, so decode base64url
// manually with plain string/array operations only.
function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');

    let bytes = '';
    let buffer = 0;
    let bitsCollected = 0;
    for (const char of normalized) {
      const value = BASE64_CHARS.indexOf(char);
      if (value === -1) continue;
      buffer = (buffer << 6) | value;
      bitsCollected += 6;
      if (bitsCollected >= 8) {
        bitsCollected -= 8;
        bytes += String.fromCharCode((buffer >> bitsCollected) & 0xff);
      }
    }

    return decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return null;
  }
}

function jwtExpiresSoon(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const decoded = decodeBase64Url(parts[1]);
    if (decoded == null) return false;
    const payload = JSON.parse(decoded);
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

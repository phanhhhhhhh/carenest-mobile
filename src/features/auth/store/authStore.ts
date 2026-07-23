import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { onSessionExpired } from '../../../core/auth/sessionEvents';
import { getStatus, extractError, getResponseData, getErrorMessage } from '../../../core/api/errors';
import type { AuthResponse, User } from '../../../shared/types';

interface AuthState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;

  login: (params: { email?: string; phone?: string; password: string }) => Promise<LoginResult>;
  register: (params: RegisterParams) => Promise<RegisterResult>;
  verifyOtp: (target: string, code: string) => Promise<boolean>;
  completeLogin: () => void;
  changePassword: (params: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<boolean>;
  sendOtp: (target: string, method: string) => Promise<boolean>;
  setupPin: (pin: string, confirmPin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<{ valid: boolean }>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

type LoginResult =
  | { type: 'success' }
  | { type: 'needsVerification'; target: string; method: 'EMAIL' | 'SMS' }
  | { type: 'error'; message: string };

interface RegisterParams {
  email?: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: string;
  phone?: string;
  dob?: string;
}

type RegisterResult =
  | { type: 'success' }
  | { type: 'needsVerification'; contact: string; message?: string }
  | { type: 'error'; message: string };

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

async function persistAuth(data: AuthResponse) {
  await storage.saveToken(data.accessToken);
  if (data.refreshToken) await storage.saveRefreshToken(data.refreshToken);
  const user = data.user;
  if (user) {
    if (user.role) await storage.saveRole(user.role);
    if (user.name) await storage.saveName(user.name);
    if (user.id) await storage.saveUserId(String(user.id));
    if (user.phone) await storage.savePhone(user.phone);
    if (user.email) await storage.saveEmail(user.email);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  user: null,
  isAuthenticated: false,

  loadSession: async () => {
    const token = await storage.getToken();
    if (!token) return;

    if (isJwtExpired(token)) {
      console.log('[authStore.loadSession] Token expired, clearing session');
      await storage.clearAll();
      return;
    }

    try {
      const role = await storage.getRole();
      const name = await storage.getName();
      const id = await storage.getUserId();
      set({
        isAuthenticated: true,
        user: {
          id: id ? Number(id) : 0,
          name: name || 'User',
          role: (role as User['role']) || 'ELDERLY',
        },
      });
    } catch (e) {
      console.warn('[authStore.loadSession]', e);
    }
  },

  login: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const body: Record<string, string> = {};
      if (params.phone) body.phone = params.phone;
      if (params.email) body.email = params.email;
      body.password = params.password;

      const res = await api.post('/auth/login', body);
      await persistAuth(res.data);
      // Defer isAuthenticated so the success screen can show first;
      // the screen calls completeLogin() to enter the app.
      set({ isLoading: false, user: res.data.user });
      return { type: 'success' };
    } catch (e) {
      const status = getStatus(e);
      if (status === 404) {
        const msg = 'Không tìm thấy tài khoản. Vui lòng đăng ký trước.';
        set({ isLoading: false, error: msg });
        return { type: 'error', message: msg };
      }
      if (status === 401) {
        const data = getResponseData(e) as Record<string, unknown> | undefined;
        const rawMsg = String(data?.error ?? data?.message ?? '').toLowerCase();
        if (rawMsg.includes('verif')) {
          set({ isLoading: false });
          return params.phone
            ? { type: 'needsVerification', target: params.phone, method: 'SMS' }
            : {
                type: 'needsVerification',
                target: String(data?.email ?? params.email ?? ''),
                method: 'EMAIL',
              };
        }
      }
      const msg = extractError(e, 'Thông tin đăng nhập không hợp lệ');
      set({ isLoading: false, error: msg });
      return { type: 'error', message: msg };
    }
  },

  verifyOtp: async (target, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { target, code });
      await persistAuth(res.data);
      set({ isLoading: false, user: res.data.user ?? null });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Mã không hợp lệ hoặc đã hết hạn');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  completeLogin: () => set({ isAuthenticated: true }),

  changePassword: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/change-password', params);
      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Không thể đổi mật khẩu');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return { success: true };
    } catch (e) {
      const msg = getErrorMessage(e) || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Không thể đặt lại mật khẩu');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/verify-email', { token });
      set({ isLoading: false });
      return { success: true };
    } catch (e) {
      const msg = getErrorMessage(e) || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  resendVerification: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/resend-verification', { email });
      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Không thể gửi lại email xác minh');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  sendOtp: async (target, method) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/send-otp', { target, method });
      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Không thể gửi mã OTP');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  setupPin: async (pin, confirmPin) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/setup-pin', { pin, confirmPin });
      set({ isLoading: false });
      return true;
    } catch (e) {
      const msg = extractError(e, 'Không thể thiết lập mã PIN');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  verifyPin: async (pin) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-pin', { pin });
      const valid = res.data?.valid === true;
      set({ isLoading: false, error: valid ? null : 'Mã PIN không hợp lệ' });
      return { valid };
    } catch (e) {
      set({ isLoading: false, error: 'Không thể xác minh mã PIN' });
      return { valid: false };
    }
  },

  register: async (params): Promise<RegisterResult> => {
    set({ isLoading: true, error: null });
    try {
      const body: Record<string, unknown> = {
        password: params.password,
        confirmPassword: params.confirmPassword,
        name: params.name,
        role: params.role,
      };
      if (params.email) body.email = params.email;
      if (params.phone) body.phone = params.phone;
      if (params.dob) body.dob = params.dob;

      const res = await api.post('/auth/register', body);
      const data = res.data;

      if (data.accessToken) {
        await persistAuth(data);
        set({ isLoading: false, isAuthenticated: true, user: data.user });
        return { type: 'success' };
      }

      set({ isLoading: false });
      if (data.requiresVerification) {
        return {
          type: 'needsVerification',
          contact: params.email || params.phone || '',
          message: data.message,
        };
      }
      // Registered but no token and no verification needed -> go log in
      return { type: 'success' };
    } catch (e) {
      const msg = extractError(e, 'Đăng ký thất bại');
      set({ isLoading: false, error: msg });
      return { type: 'error', message: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('[authStore.logout]', e);
    }
    await storage.clearAll();
    set({ isAuthenticated: false, user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

onSessionExpired(() => {
  useAuthStore.setState({ isAuthenticated: false, user: null, error: null });
});

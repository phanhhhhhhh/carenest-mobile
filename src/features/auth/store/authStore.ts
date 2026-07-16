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
  loginDev: (phoneNumber: string) => Promise<LoginResult>;
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
  | { type: 'needsVerification'; email: string }
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
      set({ isLoading: false, user: res.data.user });
      return { type: 'success' };
    } catch (e) {
      const status = getStatus(e);
      if (status === 404) {
        const msg = 'No account found. Please register first.';
        set({ isLoading: false, error: msg });
        return { type: 'error', message: msg };
      }
      if (status === 401) {
        const data = getResponseData(e) as Record<string, unknown> | undefined;
        const rawMsg = String(data?.error ?? data?.message ?? '');
        if (rawMsg.includes('verify')) {
          set({ isLoading: false });
          return {
            type: 'needsVerification',
            email: String(data?.email ?? params.email ?? ''),
          };
        }
      }
      const msg = extractError(e, 'Invalid credentials');
      set({ isLoading: false, error: msg });
      return { type: 'error', message: msg };
    }
  },

  loginDev: async (phoneNumber) => {
    if (!__DEV__) {
      return { type: 'error' as const, message: 'Dev login unavailable in production' };
    }
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', {
        firebaseToken: `DEV_PHONE:${phoneNumber}`,
      });
      await persistAuth(res.data);
      set({ isLoading: false, isAuthenticated: true, user: res.data.user });
      return { type: 'success' };
    } catch (e) {
      const status = getStatus(e);
      const msg = status === 404
        ? `DEV_NEEDS_REGISTER:${phoneNumber}`
        : 'Cannot connect to backend';
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
      const msg = extractError(e, 'Invalid or expired code');
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
      const msg = extractError(e, 'Cannot change password');
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
      const msg = getErrorMessage(e) || 'Could not send reset email. Please try again.';
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
      const msg = extractError(e, 'Could not reset password');
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
      const msg = getErrorMessage(e) || 'Invalid or expired verification link';
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
      const msg = extractError(e, 'Could not resend verification email');
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
      const msg = extractError(e, 'Could not send OTP');
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
      const msg = extractError(e, 'Could not set up PIN');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  verifyPin: async (pin) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-pin', { pin });
      const valid = res.data?.valid === true;
      set({ isLoading: false, error: valid ? null : 'Invalid PIN' });
      return { valid };
    } catch (e) {
      set({ isLoading: false, error: 'Could not verify PIN' });
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
      return {
        type: 'needsVerification',
        contact: params.email || params.phone || '',
        message: data.message,
      };
    } catch (e) {
      const msg = extractError(e, 'Registration failed');
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
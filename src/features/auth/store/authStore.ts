import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { onSessionExpired } from '../../../core/auth/sessionEvents';
import type { AuthResponse, User } from '../../../shared/types';

// ── Types ────────────────────────────────────────────────────────
interface AuthState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Actions
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

// ── Helpers ──────────────────────────────────────────────────────
function getStatus(e: unknown): number | undefined {
  if (e && typeof e === 'object' && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function getResponseData(e: unknown): Record<string, unknown> | null {
  if (e && typeof e === 'object' && 'response' in e) {
    const data = (e as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === 'object') return data as Record<string, unknown>;
  }
  return null;
}

function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const resp = (e as { response?: { data?: unknown } }).response;
    if (resp?.data && typeof resp.data === 'object') {
      const data = resp.data as Record<string, unknown>;
      return String(data.error || data.message || fallback);
    }
  }
  return fallback;
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

// ── Store ────────────────────────────────────────────────────────
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
    } catch {
      // session invalid
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
      set({ isLoading: false, isAuthenticated: true, user: res.data.user });
      return { type: 'success' };
    } catch (e) {
      // Parity with Flutter auth_repository: 404 → user not found;
      // 401 with "verify" in message → unverified email.
      const status = getStatus(e);
      if (status === 404) {
        const msg = 'No account found. Please register first.';
        set({ isLoading: false, error: msg });
        return { type: 'error', message: msg };
      }
      if (status === 401) {
        const data = getResponseData(e);
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

  // Dev mode: bypass real OTP auth (parity with Flutter loginDev)
  loginDev: async (phoneNumber) => {
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

  // Verify OTP — persists tokens like Flutter's verifyOtp, but defers the
  // isAuthenticated flip so the WelcomeBack screen can still be shown
  // (flipping immediately would unmount the entire auth stack).
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

  // Flip to authenticated — AppNavigator then switches to the role shell.
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
    } catch {
      // ignore
    }
    await storage.clearAll();
    set({ isAuthenticated: false, user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

// ── Session expiry (port of Flutter TokenNotifier) ───────────────
// When the API client fails to refresh the token it clears storage and
// emits this event; resetting the store makes AppNavigator show Welcome.
onSessionExpired(() => {
  useAuthStore.setState({ isAuthenticated: false, user: null, error: null });
});

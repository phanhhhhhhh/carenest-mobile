import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import type { AuthResponse, User } from '../../../shared/types';

// ── Types ────────────────────────────────────────────────────────
interface AuthState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  login: (params: { email?: string; phone?: string; password: string }) => Promise<boolean>;
  register: (params: RegisterParams) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

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
      return true;
    } catch (e) {
      const msg = extractError(e, 'Invalid credentials');
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

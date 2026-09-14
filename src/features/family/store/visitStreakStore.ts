import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorCode, getErrorMessage, getStatus, isCancelled } from '../../../core/api/errors';

export type VisitCycleType = 'WEEKLY' | 'MONTHLY';

export interface VisitSettingsPatch {
  cycleType?: VisitCycleType;
  enabled?: boolean;
}

export interface ConfirmVisitInput {
  note?: string;
  visitedAt?: string;
  confirmSeparateVisit?: boolean;
}

export type ConfirmVisitResult =
  { status: 'success' } | { status: 'possible_duplicate' } | { status: 'error'; message: string };

export interface VisitEntry {
  id: number;
  memberId: number;
  memberName: string;
  visitedAt: string;
  note?: string;
}

export interface VisitStreak {
  elderlyId: number;
  elderlyName: string;
  enabled: boolean;
  cycleType: VisitCycleType;
  currentStreak: number;
  longestStreak: number;
  lastVisitAt?: string;
  elderlyBirthday?: string;
  cycleEndsAt?: string;
  streakAtRisk: boolean;
  visitedThisCycle: boolean;
  recentVisits: VisitEntry[];
}

export function parseStreak(j: Record<string, unknown>): VisitStreak {
  const visits = Array.isArray(j.recentVisits) ? (j.recentVisits as Record<string, unknown>[]) : [];
  return {
    elderlyId: Number(j.elderlyId) || 0,
    elderlyName: String(j.elderlyName ?? ''),
    enabled: Boolean(j.enabled),
    cycleType: (j.cycleType === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY') as VisitCycleType,
    currentStreak: Number(j.currentStreak) || 0,
    longestStreak: Number(j.longestStreak) || 0,
    lastVisitAt: (j.lastVisitAt as string) ?? undefined,
    elderlyBirthday: (j.elderlyBirthday as string) ?? undefined,
    cycleEndsAt: (j.cycleEndsAt as string) ?? undefined,
    streakAtRisk: Boolean(j.streakAtRisk),
    visitedThisCycle: Boolean(j.visitedThisCycle),
    recentVisits: visits.map((v) => ({
      id: Number(v.id) || 0,
      memberId: Number(v.memberId) || 0,
      memberName: String(v.memberName ?? ''),
      visitedAt: String(v.visitedAt ?? ''),
      note: (v.note as string) ?? undefined,
    })),
  };
}

interface VisitStreakState {
  byElderly: Record<string, VisitStreak>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  confirmVisit: (
    elderlyId: string,
    input?: ConfirmVisitInput | string,
  ) => Promise<ConfirmVisitResult>;
  updateSettings: (elderlyId: string, patch: VisitSettingsPatch) => Promise<boolean>;
}

export const useVisitStreakStore = create<VisitStreakState>((set, get) => ({
  byElderly: {},
  isLoading: false,
  isSubmitting: false,
  error: null,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/visit-streak`, { signal });
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({ isLoading: false, byElderly: { ...s.byElderly, [elderlyId]: streak } }));
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Không tải được chuỗi về thăm: ${getErrorMessage(e)}` });
    }
  },

  confirmVisit: async (elderlyId, input) => {
    if (get().isSubmitting) {
      return { status: 'error', message: 'Yêu cầu đang được xử lý.' };
    }
    set({ isSubmitting: true, error: null });
    const payload: ConfirmVisitInput = typeof input === 'string' ? { note: input } : (input ?? {});
    try {
      const resp = await api.post(`/elderly/${elderlyId}/visits`, payload);
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({ byElderly: { ...s.byElderly, [elderlyId]: streak } }));
      return { status: 'success' };
    } catch (e) {
      if (getStatus(e) === 409 && getErrorCode(e) === 'POSSIBLE_DUPLICATE_VISIT') {
        return { status: 'possible_duplicate' };
      }
      const message = `Không xác nhận được: ${getErrorMessage(e)}`;
      set({ error: message });
      return { status: 'error', message };
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateSettings: async (elderlyId, patch) => {
    set({ isSubmitting: true, error: null });
    try {
      const resp = await api.patch(`/elderly/${elderlyId}/visit-streak/settings`, patch);
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({ isSubmitting: false, byElderly: { ...s.byElderly, [elderlyId]: streak } }));
      return true;
    } catch (e) {
      set({ isSubmitting: false, error: `Không lưu được cài đặt: ${getErrorMessage(e)}` });
      return false;
    }
  },
}));

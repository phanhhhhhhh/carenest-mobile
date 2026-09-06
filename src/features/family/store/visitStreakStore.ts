import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';

export type VisitCycleType = 'WEEKLY' | 'MONTHLY';

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

function parseStreak(j: Record<string, unknown>): VisitStreak {
  const visits = Array.isArray(j.recentVisits) ? (j.recentVisits as Record<string, unknown>[]) : [];
  return {
    elderlyId: Number(j.elderlyId) || 0,
    elderlyName: String(j.elderlyName ?? ''),
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
  confirmVisit: (elderlyId: string, note?: string) => Promise<boolean>;
  updateSettings: (
    elderlyId: string,
    patch: { cycleType?: VisitCycleType; elderlyBirthday?: string },
  ) => Promise<boolean>;
}

export const useVisitStreakStore = create<VisitStreakState>((set) => ({
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

  confirmVisit: async (elderlyId, note) => {
    set({ isSubmitting: true, error: null });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/visits`, note ? { note } : {});
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({ isSubmitting: false, byElderly: { ...s.byElderly, [elderlyId]: streak } }));
      return true;
    } catch (e) {
      set({ isSubmitting: false, error: `Không xác nhận được: ${getErrorMessage(e)}` });
      return false;
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

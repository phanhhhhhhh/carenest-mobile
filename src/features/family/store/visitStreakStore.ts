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
  loadingByElderly: Record<string, boolean>;
  submittingByElderly: Record<string, boolean>;
  errorsByElderly: Record<string, string | null>;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  confirmVisit: (
    elderlyId: string,
    input?: ConfirmVisitInput | string,
  ) => Promise<ConfirmVisitResult>;
  updateSettings: (elderlyId: string, patch: VisitSettingsPatch) => Promise<boolean>;
}

const loadTokens = new Map<string, symbol>();

export const useVisitStreakStore = create<VisitStreakState>((set, get) => ({
  byElderly: {},
  loadingByElderly: {},
  submittingByElderly: {},
  errorsByElderly: {},

  load: async (elderlyId, signal) => {
    const token = Symbol(elderlyId);
    loadTokens.set(elderlyId, token);
    set((s) => ({
      loadingByElderly: { ...s.loadingByElderly, [elderlyId]: true },
      errorsByElderly: { ...s.errorsByElderly, [elderlyId]: null },
    }));
    try {
      const resp = await api.get(`/elderly/${elderlyId}/visit-streak`, { signal });
      if (loadTokens.get(elderlyId) !== token) return;
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({
        loadingByElderly: { ...s.loadingByElderly, [elderlyId]: false },
        byElderly: { ...s.byElderly, [elderlyId]: streak },
      }));
    } catch (e) {
      if (loadTokens.get(elderlyId) !== token) return;
      if (isCancelled(e)) {
        set((s) => ({
          loadingByElderly: { ...s.loadingByElderly, [elderlyId]: false },
        }));
        return;
      }
      set((s) => ({
        loadingByElderly: { ...s.loadingByElderly, [elderlyId]: false },
        errorsByElderly: {
          ...s.errorsByElderly,
          [elderlyId]: `Không tải được nhịp về thăm: ${getErrorMessage(e)}`,
        },
      }));
    }
  },

  confirmVisit: async (elderlyId, input) => {
    if (get().submittingByElderly[elderlyId]) {
      return { status: 'error', message: 'Yêu cầu đang được xử lý.' };
    }
    set((s) => ({
      submittingByElderly: { ...s.submittingByElderly, [elderlyId]: true },
      errorsByElderly: { ...s.errorsByElderly, [elderlyId]: null },
    }));
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
      set((s) => ({ errorsByElderly: { ...s.errorsByElderly, [elderlyId]: message } }));
      return { status: 'error', message };
    } finally {
      set((s) => ({
        submittingByElderly: { ...s.submittingByElderly, [elderlyId]: false },
      }));
    }
  },

  updateSettings: async (elderlyId, patch) => {
    if (get().submittingByElderly[elderlyId]) return false;
    set((s) => ({
      submittingByElderly: { ...s.submittingByElderly, [elderlyId]: true },
      errorsByElderly: { ...s.errorsByElderly, [elderlyId]: null },
    }));
    try {
      const resp = await api.patch(`/elderly/${elderlyId}/visit-streak/settings`, patch);
      const streak = parseStreak(resp.data as Record<string, unknown>);
      set((s) => ({
        submittingByElderly: { ...s.submittingByElderly, [elderlyId]: false },
        byElderly: { ...s.byElderly, [elderlyId]: streak },
      }));
      return true;
    } catch (e) {
      set((s) => ({
        submittingByElderly: { ...s.submittingByElderly, [elderlyId]: false },
        errorsByElderly: {
          ...s.errorsByElderly,
          [elderlyId]: `Không lưu được cài đặt: ${getErrorMessage(e)}`,
        },
      }));
      return false;
    }
  },
}));

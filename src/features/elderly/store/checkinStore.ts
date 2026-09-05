import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { CheckIn, CheckInMood } from '../../../shared/types';
import { CheckInSchema, safeParseOne } from '../../../shared/schemas';

function toCheckIn(c: ReturnType<typeof CheckInSchema.parse>): CheckIn {
  const mood = (c.mood >= 1 && c.mood <= 4 ? c.mood : 2) as CheckInMood;
  return {
    id: c.id,
    mood,
    note: c.note ?? undefined,
    source: c.source ?? undefined,
    createdAt: c.createdAt,
  };
}

interface CheckInState {
  /** Latest check-in made today, keyed by elderly id. `null` = loaded, none today. */
  todayByElderly: Record<string, CheckIn | null>;
  submitting: boolean;
  error: string | null;

  loadToday: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  submit: (elderlyId: string, mood: CheckInMood) => Promise<boolean>;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  todayByElderly: {},
  submitting: false,
  error: null,

  loadToday: async (elderlyId, signal) => {
    try {
      const resp = await api.get(`/elderly/${elderlyId}/check-ins/today`, { signal });
      // 204 No Content → no check-in today
      const parsed =
        resp.status === 204 || !resp.data
          ? null
          : safeParseOne(CheckInSchema, resp.data, 'CheckInToday');
      set((s) => ({
        todayByElderly: { ...s.todayByElderly, [elderlyId]: parsed ? toCheckIn(parsed) : null },
      }));
    } catch (e) {
      if (isCancelled(e)) return;
      set({ error: `Lỗi: ${getErrorMessage(e)}` });
    }
  },

  submit: async (elderlyId, mood) => {
    set({ submitting: true, error: null });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/check-ins`, { mood, source: 'BUTTON' });
      const parsed =
        resp.status === 200 || resp.status === 201
          ? safeParseOne(CheckInSchema, resp.data, 'CheckInCreate')
          : null;
      if (!parsed) {
        set({ submitting: false, error: 'Không thể lưu trạng thái. Vui lòng thử lại.' });
        return false;
      }
      set((s) => ({
        submitting: false,
        todayByElderly: { ...s.todayByElderly, [elderlyId]: toCheckIn(parsed) },
      }));
      return true;
    } catch (e) {
      set({ submitting: false, error: `Không thể lưu trạng thái: ${getErrorMessage(e)}` });
      return false;
    }
  },
}));

export function selectTodayCheckIn(
  state: CheckInState,
  elderlyId: string | null,
): CheckIn | null | undefined {
  if (!elderlyId) return undefined;
  return state.todayByElderly[elderlyId];
}

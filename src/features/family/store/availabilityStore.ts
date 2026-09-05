import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { AvailabilityStatus } from '../../../shared/types';
import { FamilyElderlyLinkSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

interface LinkAvailability {
  linkId: string;
  status: AvailabilityStatus;
}

interface AvailabilityState {
  /** This family user's link + FREE/BUSY state, keyed by elderly id. */
  byElderly: Record<string, LinkAvailability>;
  loading: boolean;
  error: string | null;

  load: (signal?: AbortSignal) => Promise<void>;
  setStatus: (elderlyId: string, status: AvailabilityStatus) => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  byElderly: {},
  loading: false,
  error: null,

  load: async (signal) => {
    const userId = await storage.getUserId();
    if (!userId) return;
    set({ loading: true, error: null });
    try {
      const resp = await api.get(`/family/${userId}/elderly`, { signal });
      const links = safeParseList(FamilyElderlyLinkSchema, resp.data, 'FamilyElderlyLinks');
      const byElderly: Record<string, LinkAvailability> = {};
      for (const l of links) {
        byElderly[l.elderlyId] = { linkId: l.linkId, status: l.availabilityStatus };
      }
      set({ loading: false, byElderly });
    } catch (e) {
      if (isCancelled(e)) return;
      set({ loading: false, error: `Lỗi khi tải trạng thái: ${getErrorMessage(e)}` });
    }
  },

  setStatus: async (elderlyId, status) => {
    const entry = get().byElderly[elderlyId];
    if (!entry) return;
    const prev = entry.status;

    // optimistic
    set((s) => ({
      byElderly: { ...s.byElderly, [elderlyId]: { ...entry, status } },
    }));

    try {
      await api.patch(`/family-links/${entry.linkId}/availability`, { availabilityStatus: status });
    } catch (e) {
      set((s) => ({
        byElderly: { ...s.byElderly, [elderlyId]: { ...entry, status: prev } },
      }));
      showErrorToast(`Không đổi được trạng thái: ${getErrorMessage(e)}`);
    }
  },
}));

export function selectAvailability(
  state: AvailabilityState,
  elderlyId: string | null,
): LinkAvailability | undefined {
  if (!elderlyId) return undefined;
  return state.byElderly[elderlyId];
}

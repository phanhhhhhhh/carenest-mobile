import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import type { FamilyBroadcast } from '../../../shared/types';
import { FamilyBroadcastSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast } from '../../../shared/components/toastStore';

function toBroadcast(b: ReturnType<typeof FamilyBroadcastSchema.parse>): FamilyBroadcast {
  return {
    id: b.id,
    elderlyId: b.elderlyId,
    triggerType: b.triggerType,
    title: b.title,
    body: b.body,
    status: b.status,
    currentRecipientId: b.currentRecipientId ?? undefined,
    startedAt: b.startedAt,
    acknowledgedAt: b.acknowledgedAt ?? undefined,
    acknowledgedBy: b.acknowledgedBy ?? undefined,
    escalatedAt: b.escalatedAt ?? undefined,
  };
}

interface BroadcastState {
  /** ACTIVE / ESCALATED broadcasts, keyed by elderly id. */
  byElderly: Record<string, FamilyBroadcast[]>;
  acknowledgingId: string | null;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  acknowledge: (elderlyId: string, broadcastId: string) => Promise<boolean>;
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  byElderly: {},
  acknowledgingId: null,

  load: async (elderlyId, signal) => {
    try {
      const resp = await api.get(`/elderly/${elderlyId}/broadcasts/active`, { signal });
      const list = safeParseList(FamilyBroadcastSchema, resp.data, 'FamilyBroadcasts').map(
        toBroadcast,
      );
      set((s) => ({ byElderly: { ...s.byElderly, [elderlyId]: list } }));
    } catch (e) {
      if (isCancelled(e)) return;
      // a broadcast banner is non-critical — fail quiet
    }
  },

  acknowledge: async (elderlyId, broadcastId) => {
    set({ acknowledgingId: broadcastId });
    try {
      await api.patch(`/broadcasts/${broadcastId}/acknowledge`);
      set((s) => ({
        acknowledgingId: null,
        byElderly: {
          ...s.byElderly,
          [elderlyId]: (s.byElderly[elderlyId] ?? []).filter((b) => b.id !== broadcastId),
        },
      }));
      return true;
    } catch (e) {
      set({ acknowledgingId: null });
      showErrorToast(`Không xác nhận được: ${getErrorMessage(e)}`);
      return false;
    }
  },
}));

export function selectActiveBroadcast(
  state: BroadcastState,
  elderlyId: string | null,
): FamilyBroadcast | undefined {
  if (!elderlyId) return undefined;
  return (state.byElderly[elderlyId] ?? []).find(
    (b) => b.status === 'ACTIVE' || b.status === 'ESCALATED',
  );
}

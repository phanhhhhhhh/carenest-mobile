import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';

export type CameraConsentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface CameraConsent {
  elderlyId: number;
  status: CameraConsentStatus;
  decidedAt?: string;
  retryAfter?: string;
  canLinkCamera: boolean;
  message: string;
}

function parse(j: Record<string, unknown>): CameraConsent {
  const status = (
    j.status === 'ACCEPTED' || j.status === 'DECLINED' ? j.status : 'PENDING'
  ) as CameraConsentStatus;
  return {
    elderlyId: Number(j.elderlyId) || 0,
    status,
    decidedAt: (j.decidedAt as string) ?? undefined,
    retryAfter: (j.retryAfter as string) ?? undefined,
    canLinkCamera: Boolean(j.canLinkCamera),
    message: String(j.message ?? ''),
  };
}

interface CameraConsentState {
  byElderly: Record<string, CameraConsent>;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  decide: (elderlyId: string, accepted: boolean) => Promise<boolean>;
}

export const useCameraConsentStore = create<CameraConsentState>((set) => ({
  byElderly: {},
  isLoading: false,
  isSubmitting: false,
  error: null,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get(`/elderly/${elderlyId}/camera-consent`, { signal });
      set((s) => ({
        isLoading: false,
        byElderly: { ...s.byElderly, [elderlyId]: parse(resp.data as Record<string, unknown>) },
      }));
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Không tải được trạng thái camera: ${getErrorMessage(e)}` });
    }
  },

  decide: async (elderlyId, accepted) => {
    set({ isSubmitting: true, error: null });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/camera-consent`, { accepted });
      set((s) => ({
        isSubmitting: false,
        byElderly: { ...s.byElderly, [elderlyId]: parse(resp.data as Record<string, unknown>) },
      }));
      return true;
    } catch (e) {
      set({ isSubmitting: false, error: `Không lưu được lựa chọn: ${getErrorMessage(e)}` });
      return false;
    }
  },
}));

import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage, isCancelled } from '../../../core/api/errors';
import {
  cameraLinkFailure,
  normalizeCameraLinkInput,
  type CameraLinkResult,
} from '../services/cameraLinking';
import {
  CameraDeviceSchema,
  CameraStatusSchema,
  CameraSnapshotSchema,
  CameraLiveStreamSchema,
  safeParseOne,
  safeParseList,
} from '../../../shared/schemas';

export interface CameraDeviceData {
  id: number;
  label: string;
  deviceSn: string;
  status: string;
  privacyMode: boolean;
  motionDetectionEnabled: boolean;
  snapshotSchedule: string;
  capabilities: string[];
}

function toCameraDeviceData(c: ReturnType<typeof CameraDeviceSchema.parse>): CameraDeviceData {
  return {
    id: c.id,
    label: c.label ?? 'Camera',
    deviceSn: c.deviceSn ?? '',
    status: c.status ?? 'OFFLINE',
    privacyMode: c.privacyMode ?? false,
    motionDetectionEnabled: c.motionDetectionEnabled ?? false,
    snapshotSchedule: c.snapshotSchedule ?? '',
    capabilities: c.capabilities ?? [],
  };
}

export function isCameraOnline(c: CameraDeviceData): boolean {
  return c.status === 'ONLINE';
}

export interface CameraStatusData {
  hasCamera: boolean;
  cameraCount: number;
  allOnline: boolean;
  indicatorColor: string;
  statusText: string;
}

const DEFAULT_CAMERA_STATUS: CameraStatusData = {
  hasCamera: false,
  cameraCount: 0,
  allOnline: false,
  indicatorColor: 'GRAY',
  statusText: '',
};

function toCameraStatusData(c: ReturnType<typeof CameraStatusSchema.parse>): CameraStatusData {
  return {
    hasCamera: c.hasCamera,
    cameraCount: c.cameraCount ?? 0,
    allOnline: c.allOnline ?? false,
    indicatorColor: c.indicatorColor ?? 'GRAY',
    statusText: c.statusText ?? '',
  };
}

export interface CameraSnapshotData {
  id: number;
  imageUrl: string;
  trigger: string;
  success: boolean;
  createdAt: string;
}

export type LiveViewPhase = 'idle' | 'loading' | 'ready' | 'offline' | 'privacy'
  | 'consent' | 'unsupported' | 'expired' | 'providerError' | 'streamError';

export interface CameraLiveStreamData {
  cameraId: number;
  label: string;
  streamUrl: string;
  confirmedAt: string;
  lastSeenAt: string | null;
}

export interface LiveViewState {
  phase: LiveViewPhase;
  message: string | null;
  stream: CameraLiveStreamData | null;
  lastSeenAt: string | null;
}

const EMPTY_LIVE_VIEW: LiveViewState = {
  phase: 'idle', message: null, stream: null, lastSeenAt: null,
};

export function cameraLiveFailure(error: unknown): Omit<LiveViewState, 'stream'> {
  const response = error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: Record<string, unknown> } }).response : undefined;
  const data = response?.data;
  const code = typeof data?.code === 'string' ? data.code : '';
  const lastSeenAt = typeof data?.lastSeenAt === 'string' ? data.lastSeenAt : null;
  switch (code) {
    case 'CAMERA_OFFLINE':
      return { phase: 'offline', message: 'Camera đang ngoại tuyến.', lastSeenAt };
    case 'CAMERA_PRIVACY_ACTIVE':
      return { phase: 'privacy', message: 'Người thân đang bật Chế độ riêng tư.', lastSeenAt };
    case 'CAMERA_CONSENT_REQUIRED':
      return { phase: 'consent', message: 'Cần sự đồng ý của người thân để xem camera.', lastSeenAt };
    case 'CAMERA_UNSUPPORTED_STREAM':
    case 'CAMERA_UNSUPPORTED_DEVICE':
      return { phase: 'unsupported', message: 'Thiết bị này chưa hỗ trợ phát video trong CareNest.', lastSeenAt };
    case 'CAMERA_STREAM_EXPIRED':
      return { phase: 'expired', message: 'Luồng xem đã hết hạn. Hãy thử lại để lấy luồng mới.', lastSeenAt };
    case 'IMOU_PROVIDER_UNAVAILABLE':
    case 'CAMERA_STATUS_PROVIDER_UNAVAILABLE':
    case 'IMOU_INVALID_CREDENTIALS':
      return { phase: 'providerError', message: 'Dịch vụ camera đang tạm gián đoạn. Hãy thử lại.', lastSeenAt };
    default:
      return { phase: 'streamError', message: 'Không thể mở luồng trực tiếp. Hãy thử lại.', lastSeenAt };
  }
}

function toCameraSnapshotData(
  s: ReturnType<typeof CameraSnapshotSchema.parse>,
): CameraSnapshotData {
  return {
    id: s.id,
    imageUrl: s.imageUrl ?? '',
    trigger: s.trigger ?? 'CHECK_IN',
    success: s.success ?? true,
    createdAt: s.createdAt ?? new Date().toISOString(),
  };
}

interface CameraState {
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
  linkError: Exclude<CameraLinkResult, { ok: true }> | null;
  status: CameraStatusData;
  cameras: CameraDeviceData[];
  timeline: CameraSnapshotData[];
  liveStreamUrl: string | null;
  liveView: LiveViewState;
  voiceActive: boolean;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  bindCamera: (
    elderlyId: string,
    deviceSn: string,
    label: string,
    verificationCode?: string,
  ) => Promise<CameraLinkResult>;
  clearLinkError: () => void;
  unbindCamera: (elderlyId: string, deviceId: number) => Promise<boolean>;
  getLiveStream: (deviceId: number) => Promise<CameraLiveStreamData | null>;
  captureSosSnapshot: (elderlyId: string, emergencyEventId?: number) => Promise<string | null>;
  startVoiceCall: (deviceId: number) => Promise<boolean>;
  stopVoiceCall: (deviceId: number) => Promise<boolean>;
  setPrivacyMode: (elderlyId: string, deviceId: number, enabled: boolean) => Promise<boolean>;
  toggleMotionDetection: (
    elderlyId: string,
    deviceId: number,
    enabled: boolean,
  ) => Promise<boolean>;
  controlPtz: (deviceId: number, direction: string) => Promise<boolean>;
  clearLiveStream: () => void;
  refresh: (elderlyId: string) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  isLoading: false,
  error: null,
  isProcessing: false,
  linkError: null,
  status: DEFAULT_CAMERA_STATUS,
  cameras: [],
  timeline: [],
  liveStreamUrl: null,
  liveView: EMPTY_LIVE_VIEW,
  voiceActive: false,

  load: async (elderlyId, signal) => {
    set({ isLoading: true, error: null });
    try {
      const [statusResp, camerasResp, timelineResp] = await Promise.all([
        api.get(`/elderly/${elderlyId}/camera-status`, { signal }),
        api.get(`/elderly/${elderlyId}/cameras`, { signal }),
        api.get(`/elderly/${elderlyId}/camera-timeline`, { params: { page: 0, size: 20 }, signal }),
      ]);

      const parsedStatus = safeParseOne(CameraStatusSchema, statusResp.data, 'CameraStatus');
      const statusData = parsedStatus ? toCameraStatusData(parsedStatus) : get().status;

      const cameras = safeParseList(CameraDeviceSchema, camerasResp.data, 'CameraDeviceList').map(
        toCameraDeviceData,
      );

      const timelineRaw = (timelineResp.data as Record<string, unknown>)?.snapshots;
      const timeline = safeParseList(CameraSnapshotSchema, timelineRaw, 'CameraSnapshotList').map(
        toCameraSnapshotData,
      );

      set({ isLoading: false, status: statusData, cameras, timeline });
    } catch (e) {
      if (isCancelled(e)) return;
      if (getStatus(e) === 404) {
        set({ isLoading: false });
        return;
      }
      set({ isLoading: false, error: `Không thể tải camera: ${getErrorMessage(e)}` });
    }
  },

  bindCamera: async (elderlyId, deviceSn, label, verificationCode) => {
    if (get().isProcessing) {
      return {
        ok: false,
        code: 'REQUEST_IN_PROGRESS',
        message: 'Yêu cầu liên kết đang được xử lý.',
      };
    }
    const input = normalizeCameraLinkInput({ deviceSn, label, verificationCode });
    set({ isProcessing: true, linkError: null });
    try {
      const response = await api.post(`/elderly/${elderlyId}/cameras`, input);
      const parsed = safeParseOne(CameraDeviceSchema, response.data, 'LinkedCamera');
      if (parsed) {
        const linked = toCameraDeviceData(parsed);
        set((state) => ({
          cameras: [linked, ...state.cameras.filter((camera) => camera.id !== linked.id)],
        }));
      }
      await get().load(elderlyId);
      set({ isProcessing: false, linkError: null });
      return { ok: true };
    } catch (e) {
      const failure = cameraLinkFailure(e);
      set({ isProcessing: false, linkError: failure });
      return failure;
    }
  },

  clearLinkError: () => set({ linkError: null }),

  unbindCamera: async (elderlyId, deviceId) => {
    set({ isProcessing: true });
    try {
      await api.delete(`/cameras/${deviceId}`);
      await get().load(elderlyId);
      set({ isProcessing: false });
      return true;
    } catch (e) {
      set({ isProcessing: false, error: `Không thể gỡ camera: ${getErrorMessage(e)}` });
      return false;
    }
  },

  getLiveStream: async (deviceId) => {
    if (get().liveView.phase === 'loading') return null;
    set({
      isProcessing: true,
      liveStreamUrl: null,
      liveView: { ...EMPTY_LIVE_VIEW, phase: 'loading' },
    });
    try {
      const resp = await api.get(`/cameras/${deviceId}/live`);
      const data = safeParseOne(CameraLiveStreamSchema, resp.data, 'CameraLiveStream');
      if (!data) throw new Error('Invalid live-stream response');
      const stream: CameraLiveStreamData = {
        cameraId: data.cameraId,
        label: data.label,
        streamUrl: data.streamUrl,
        confirmedAt: data.confirmedAt,
        lastSeenAt: data.lastSeenAt ?? null,
      };
      set({
        isProcessing: false,
        liveStreamUrl: stream.streamUrl,
        liveView: { phase: 'ready', message: null, stream, lastSeenAt: stream.lastSeenAt },
      });
      return stream;
    } catch (e) {
      const failure = cameraLiveFailure(e);
      set({
        isProcessing: false,
        liveStreamUrl: null,
        liveView: { ...failure, stream: null },
      });
      return null;
    }
  },

  captureSosSnapshot: async (elderlyId, emergencyEventId) => {
    set({ isProcessing: true });
    try {
      const resp = await api.post(`/elderly/${elderlyId}/cameras/snapshot`, {
        ...(emergencyEventId != null ? { emergencyEventId } : {}),
      });
      const data = resp.data as Record<string, unknown>;
      const url = (data.imageUrl as string) ?? '';
      await get().load(elderlyId);
      set({ isProcessing: false });
      return url.length > 0 ? url : null;
    } catch (e) {
      console.warn('[cameraStore.captureSosSnapshot]', e);
      set({ isProcessing: false });
      return null;
    }
  },

  startVoiceCall: async (deviceId) => {
    try {
      await api.post(`/cameras/${deviceId}/voice/start`);
      set({ voiceActive: true });
      return true;
    } catch (e) {
      console.warn('[cameraStore.startVoiceCall]', e);
      return false;
    }
  },

  stopVoiceCall: async (deviceId) => {
    try {
      await api.post(`/cameras/${deviceId}/voice/stop`);
      set({ voiceActive: false });
      return true;
    } catch (e) {
      console.warn('[cameraStore.stopVoiceCall]', e);
      return false;
    }
  },

  setPrivacyMode: async (elderlyId, deviceId, enabled) => {
    try {
      await api.post(`/cameras/${deviceId}/privacy`, { enabled });
      await get().load(elderlyId);
      return true;
    } catch (e) {
      console.warn('[cameraStore.setPrivacyMode]', e);
      return false;
    }
  },

  toggleMotionDetection: async (elderlyId, deviceId, enabled) => {
    try {
      await api.put(`/cameras/${deviceId}/motion-detection`, { enabled });
      await get().load(elderlyId);
      return true;
    } catch (e) {
      console.warn('[cameraStore.toggleMotionDetection]', e);
      return false;
    }
  },

  controlPtz: async (deviceId, direction) => {
    try {
      const resp = await api.post(`/cameras/${deviceId}/ptz`, { direction });
      const status =
        resp.data && typeof resp.data === 'object'
          ? (resp.data as Record<string, unknown>).status
          : null;
      return status === 'OK';
    } catch (e) {
      console.warn('[cameraStore.controlPtz]', e);
      return false;
    }
  },

  clearLiveStream: () => set({ liveStreamUrl: null, liveView: EMPTY_LIVE_VIEW }),

  refresh: (elderlyId) => {
    get().load(elderlyId);
  },
}));

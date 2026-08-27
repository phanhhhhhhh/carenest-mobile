import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage, isCancelled } from '../../../core/api/errors';
import {
  CameraDeviceSchema,
  CameraStatusSchema,
  CameraSnapshotSchema,
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
}

function toCameraDeviceData(c: ReturnType<typeof CameraDeviceSchema.parse>): CameraDeviceData {
  return {
    id: c.id,
    label: c.label ?? 'Camera',
    deviceSn: c.deviceSn ?? '',
    status: c.status ?? 'ONLINE',
    privacyMode: c.privacyMode ?? false,
    motionDetectionEnabled: c.motionDetectionEnabled ?? false,
    snapshotSchedule: c.snapshotSchedule ?? '',
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
  status: CameraStatusData;
  cameras: CameraDeviceData[];
  timeline: CameraSnapshotData[];
  liveStreamUrl: string | null;
  voiceActive: boolean;

  load: (elderlyId: string, signal?: AbortSignal) => Promise<void>;
  bindCamera: (elderlyId: string, deviceSn: string, label: string) => Promise<boolean>;
  unbindCamera: (elderlyId: string, deviceId: number) => Promise<boolean>;
  getLiveStream: (deviceId: number) => Promise<string | null>;
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
  status: DEFAULT_CAMERA_STATUS,
  cameras: [],
  timeline: [],
  liveStreamUrl: null,
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

  bindCamera: async (elderlyId, deviceSn, label) => {
    set({ isProcessing: true });
    try {
      await api.post(`/elderly/${elderlyId}/cameras`, { deviceSn, label });
      await get().load(elderlyId);
      set({ isProcessing: false });
      return true;
    } catch (e) {
      set({ isProcessing: false, error: `Không thể kết nối camera: ${getErrorMessage(e)}` });
      return false;
    }
  },

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
    set({ isProcessing: true });
    try {
      const resp = await api.get(`/cameras/${deviceId}/live`);
      const data = resp.data as Record<string, unknown>;
      const url =
        (data.streamUrl as string) || (data.rtspUrl as string) || (data.hlsUrl as string) || '';
      set({ isProcessing: false, liveStreamUrl: url });
      return url.length > 0 ? url : null;
    } catch (e) {
      set({ isProcessing: false, error: `Không thể lấy luồng video: ${getErrorMessage(e)}` });
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

  clearLiveStream: () => set({ liveStreamUrl: null }),

  refresh: (elderlyId) => {
    get().load(elderlyId);
  },
}));

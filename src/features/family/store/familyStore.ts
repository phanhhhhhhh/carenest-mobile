import { create } from 'zustand';
import api from '../../../core/api/client';
import * as storage from '../../../core/storage/secureStorage';
import { getErrorMessage, getStatus, getResponseData, isCancelled } from '../../../core/api/errors';
import type { ElderlySummary, HealthMetric, AppointmentItem } from '../../../shared/types';
import {
  FamilyLinkSchema,
  FamilyDashboardResponseSchema,
  type FamilyDashboardResponseParsed,
  safeParseList,
  safeParseOne,
} from '../../../shared/schemas';

export interface FamilyDashboardData {
  linkedElderly: ElderlySummary[];
  selectedIndex: number;
  totalMedications: number;
  takenMedications: number;
  /** Latest reading per metric type for the selected elderly — sourced from the aggregate endpoint. */
  latestMetrics: Record<string, HealthMetric>;
  /** Upcoming appointments for the selected elderly — sourced from the aggregate endpoint. */
  upcomingAppointments: AppointmentItem[];
}

function toLatestMetrics(
  raw: FamilyDashboardResponseParsed['elderly'][number]['latestMetrics'],
): Record<string, HealthMetric> {
  const out: Record<string, HealthMetric> = {};
  for (const [type, m] of Object.entries(raw ?? {})) {
    out[type] = {
      id: type,
      type,
      value: String(m.value),
      valueSecondary: m.valueSecondary != null ? String(m.valueSecondary) : undefined,
      unit: m.unit ?? undefined,
      recordedAt: m.recordedAt,
    };
  }
  return out;
}

function toUpcomingAppointments(
  raw: FamilyDashboardResponseParsed['elderly'][number]['upcomingAppointments'],
): AppointmentItem[] {
  return (raw ?? []).map((a) => ({
    id: a.id,
    doctor: a.doctor,
    specialty: a.specialty ?? '',
    location: a.location ?? undefined,
    appointmentDate: a.datetime,
    status: a.status ?? 'SCHEDULED',
    notes: a.notes ?? undefined,
  }));
}

interface FamilyDashboardState {
  isLoading: boolean;
  error: string | null;
  data: FamilyDashboardData | null;
  lastRefreshed: Date | null;

  load: (signal?: AbortSignal) => Promise<void>;
  selectElderly: (index: number) => Promise<void>;
  refresh: () => void;
  elderlyId: () => string | null;
  elderlyName: () => string | null;
  healthConditions: () => string[];
}

export const useFamilyDashboardStore = create<FamilyDashboardState>((set, get) => ({
  isLoading: false,
  error: null,
  data: null,
  lastRefreshed: null,

  load: async (signal) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false, error: 'Chưa đăng nhập' });
        return;
      }

      // Replaces the elderly-list, medication-adherence, latest-vitals, and
      // upcoming-appointments requests this screen used to make separately — see
      // DashboardController. Medication line-items and camera status still load
      // from their own stores since the aggregate only returns adherence counts,
      // not individual medication/camera records.
      let payload: FamilyDashboardResponseParsed;
      try {
        const dashResp = await api.get(`/dashboard/family/${userId}`, { signal });
        const parsed = safeParseOne(FamilyDashboardResponseSchema, dashResp.data, 'FamilyDashboard');
        if (!parsed) {
          set({ isLoading: false, error: 'Định dạng phản hồi dashboard không hợp lệ' });
          return;
        }
        payload = parsed;
      } catch (e) {
        if (isCancelled(e)) return;
        set({
          isLoading: false,
          error: `Lỗi API: ${getStatus(e) ?? ''} ${getErrorMessage(e)}`,
        });
        return;
      }

      const elderlyList: ElderlySummary[] = (payload.elderly ?? []).map((e) => ({
        elderlyId: String(e.elderlyId),
        elderlyName: e.elderlyName ?? '',
        healthConditions: e.healthConditions ?? [],
      }));

      const prevIndex = get().data?.selectedIndex ?? 0;
      const selectedIndex = prevIndex < elderlyList.length ? prevIndex : 0;
      const selectedEntry = elderlyList.length > 0 ? payload.elderly[selectedIndex] : null;

      set({
        isLoading: false,
        lastRefreshed: new Date(),
        data: {
          linkedElderly: elderlyList,
          selectedIndex,
          totalMedications: selectedEntry?.medicationAdherence?.totalDue ?? 0,
          takenMedications: selectedEntry?.medicationAdherence?.taken ?? 0,
          latestMetrics: toLatestMetrics(selectedEntry?.latestMetrics),
          upcomingAppointments: toUpcomingAppointments(selectedEntry?.upcomingAppointments),
        },
      });
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: 'Lỗi kết nối' });
    }
  },

  selectElderly: async (index) => {
    const data = get().data;
    if (!data || index >= data.linkedElderly.length) return;

    set({
      data: {
        linkedElderly: data.linkedElderly,
        selectedIndex: index,
        totalMedications: 0,
        takenMedications: 0,
        latestMetrics: {},
        upcomingAppointments: [],
      },
    });

    await get().load();
  },

  refresh: () => {
    get().load();
  },

  elderlyId: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].elderlyId
      : null;
  },

  elderlyName: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].elderlyName
      : null;
  },

  healthConditions: () => {
    const data = get().data;
    return data && data.linkedElderly.length > 0 && data.selectedIndex < data.linkedElderly.length
      ? data.linkedElderly[data.selectedIndex].healthConditions
      : [];
  },
}));


interface FamilyLinkState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  sendLinkRequest: (elderlyId: string) => Promise<boolean>;
  lookupUserByPhone: (phone: string) => Promise<string | null>;
}

export const useFamilyLinkStore = create<FamilyLinkState>((set) => ({
  isLoading: false,
  error: null,
  success: false,

  sendLinkRequest: async (elderlyId) => {
    set({ isLoading: true, error: null, success: false });
    try {
      const familyId = await storage.getUserId();
      if (!familyId) {
        set({ isLoading: false, error: 'Chưa đăng nhập' });
        return false;
      }
      await api.post('/family-links', {
        familyId: Number.parseInt(familyId, 10),
        elderlyId: Number.parseInt(elderlyId, 10),
        relationship: 'Người thân',
      });
      set({ isLoading: false, success: true });
      return true;
    } catch (e) {
      const data = getResponseData(e) as Record<string, unknown> | undefined;
      if (data) {
        const msg = String(data.error ?? data.message ?? 'Không thể gửi yêu cầu');
        set({ isLoading: false, error: msg });
      } else {
        set({ isLoading: false, error: 'Lỗi kết nối' });
      }
      return false;
    }
  },

  lookupUserByPhone: async (phone) => {
    try {
      const resp = await api.get(`/users/by-phone/${phone}`);
      const id = resp.data?.id != null ? String(resp.data.id) : null;
      return id;
    } catch {
      return null;
    }
  },
}));


export interface LinkedFamilyMember {
  id: string;
  name: string;
  phone: string;
}

function toLinkedFamilyMember(l: ReturnType<typeof FamilyLinkSchema.parse>): LinkedFamilyMember {
  return {
    id: l.id ?? l.linkId ?? '',
    name: l.familyName ?? '',
    phone: '',
  };
}

interface LinkedFamilyState {
  isLoading: boolean;
  error: string | null;
  members: LinkedFamilyMember[];

  load: () => Promise<void>;
}

export const useLinkedFamilyStore = create<LinkedFamilyState>((set) => ({
  isLoading: false,
  error: null,
  members: [],

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await storage.getUserId();
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const resp = await api.get(`/elderly/${userId}/family`);
      const members = safeParseList(FamilyLinkSchema, resp.data, 'LinkedFamilyList').map(toLinkedFamilyMember);
      set({ isLoading: false, members });
    } catch (e) {
      set({ isLoading: false, error: `Lỗi khi tải danh sách: ${getErrorMessage(e)}` });
    }
  },
}));

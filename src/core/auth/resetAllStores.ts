import type { StoreApi, UseBoundStore } from 'zustand';
import { useChatStore } from '../../features/elderly/store/chatStore';
import { useCheckInStore } from '../../features/elderly/store/checkinStore';
import { useElderlyProfileStore } from '../../features/elderly/store/elderlyStore';
import { resetGoogleFitStores } from '../../features/elderly/store/googleFitStore';
import { resetHealthMetricStores } from '../../features/elderly/store/healthMetricStore';
import { useHealthReportStore } from '../../features/elderly/store/healthReportStore';
import { useMedicationStore } from '../../features/elderly/store/medicationStore';
import { useAppointmentStore } from '../../features/family/store/appointmentStore';
import { useAvailabilityStore } from '../../features/family/store/availabilityStore';
import { useBroadcastStore } from '../../features/family/store/broadcastStore';
import { useCameraConsentStore } from '../../features/family/store/cameraConsentStore';
import { useCameraStore } from '../../features/family/store/cameraStore';
import { useEmergencyEventStore } from '../../features/family/store/emergencyEventStore';
import { useFamilyDigestStore } from '../../features/family/store/familyDigestStore';
import {
  useFamilyDashboardStore,
  useFamilyLinkStore,
  useLinkedFamilyStore,
} from '../../features/family/store/familyStore';
import { useFeedStore } from '../../features/family/store/feedStore';
import { useHealthThresholdStore } from '../../features/family/store/healthThresholdStore';
import { usePaymentStore } from '../../features/family/store/paymentStore';
import { useVisitStreakStore } from '../../features/family/store/visitStreakStore';
import { useWeeklySummaryStore } from '../../features/family/store/weeklySummaryStore';
import { useNotificationSettingsStore } from '../../features/notifications/store/notificationSettingsStore';
import { useNotificationStore } from '../../features/notifications/store/notificationStore';

/**
 * Zustand keeps the object returned by the store initializer, so
 * `getInitialState()` still carries the store's actions — replacing the whole
 * state with it restores the pristine store without touching each store's file.
 */
function reset<T>(store: UseBoundStore<StoreApi<T>>): void {
  store.setState(store.getInitialState(), true);
}

/**
 * Drops every piece of per-user state held in memory. Called on logout and on
 * session expiry so signing in with a different account on the same device
 * never shows the previous user's data before each screen refetches.
 * `authStore` is intentionally excluded — it resets its own state in `logout()`.
 */
export function resetAllStores(): void {
  reset(useChatStore);
  reset(useCheckInStore);
  reset(useElderlyProfileStore);
  reset(useHealthReportStore);
  reset(useMedicationStore);
  reset(useAppointmentStore);
  reset(useAvailabilityStore);
  reset(useBroadcastStore);
  reset(useCameraConsentStore);
  reset(useCameraStore);
  reset(useEmergencyEventStore);
  reset(useFamilyDigestStore);
  reset(useFamilyDashboardStore);
  reset(useFamilyLinkStore);
  reset(useLinkedFamilyStore);
  reset(useFeedStore);
  reset(useHealthThresholdStore);
  reset(usePaymentStore);
  reset(useVisitStreakStore);
  reset(useWeeklySummaryStore);
  reset(useNotificationSettingsStore);
  reset(useNotificationStore);

  // Per-elderly stores live in a module-level Map keyed by elderly id, so the
  // Map itself has to be dropped too, not just each store's state.
  resetHealthMetricStores();
  resetGoogleFitStores();
}

import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage } from '../../../core/api/errors';

/**
 * Port of Flutter's payment_provider.dart (PaymentNotifier).
 *
 * Note: the Flutter notifier called `load()` from its constructor. Callers
 * here should invoke `load()` from a screen's mount effect instead.
 *
 * The Flutter provider only stores the returned `paymentUrl` in state — it
 * does not launch it. Opening the URL (e.g. via `Linking.openURL`) is left
 * to the screen, matching the original architecture.
 */

// ── Models ────────────────────────────────────────────────────────────

export interface PlanData {
  id: string;
  name: string;
  price: number;
  currency?: string;
  features: string[];
}

function parsePlanData(j: Record<string, unknown>): PlanData {
  return {
    id: (j.id as string) ?? 'FREE',
    name: (j.name as string) ?? '',
    price: j.price != null ? Number(j.price) : 0,
    currency: (j.currency as string) ?? undefined,
    features: Array.isArray(j.features) ? (j.features as unknown[]).map((e) => String(e)) : [],
  };
}

export function isFreePlan(p: PlanData): boolean {
  return p.id === 'FREE';
}

export function getPriceLabel(p: PlanData): string {
  return isFreePlan(p) ? 'Free' : `${Math.trunc(p.price)}đ`;
}

export function getPeriodLabel(p: PlanData): string | null {
  if (p.id === 'PREMIUM_MONTHLY') return '/month';
  if (p.id === 'PREMIUM_YEARLY') return '/year';
  return null;
}

export interface SubscriptionData {
  planId: string;
  status: string; // ACTIVE, CANCELLED, EXPIRED
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
}

function parseSubscriptionData(j: Record<string, unknown>): SubscriptionData {
  return {
    planId: (j.planId as string) ?? 'FREE',
    status: (j.status as string) ?? 'ACTIVE',
    startDate: j.startDate != null ? String(j.startDate) : undefined,
    endDate: j.endDate != null ? String(j.endDate) : undefined,
    autoRenew: (j.autoRenew as boolean) ?? false,
  };
}

export function isPremiumSubscription(s: SubscriptionData): boolean {
  return s.planId.startsWith('PREMIUM') && s.status === 'ACTIVE';
}

const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 0,
    features: [
      'Monitor 1 elderly profile',
      '7-day data history',
      'Basic health tracking',
      'SOS alerts',
    ],
  },
  {
    id: 'PREMIUM_MONTHLY',
    name: 'Premium Monthly',
    price: 49000,
    currency: 'VND',
    features: [
      'Monitor multiple elderly profiles',
      'Unlimited data history',
      'AI Weekly Summary Reports',
      'Export health reports as PDF',
      'Priority support',
    ],
  },
  {
    id: 'PREMIUM_YEARLY',
    name: 'Premium Yearly',
    price: 399000,
    currency: 'VND',
    features: ['All Premium Monthly features', '2 months free (save 17%)'],
  },
];

// ── State ──────────────────────────────────────────────────────────────

interface PaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  plans: PlanData[];
  subscription: SubscriptionData | null;
  paymentUrl: string | null;
  paymentSuccess: string | null;

  load: () => Promise<void>;
  createPayment: (planId: string, method?: string) => Promise<string | null>;
  cancelSubscription: () => Promise<boolean>;
  clearPaymentUrl: () => void;
  clearSuccess: () => void;
  currentPlanLabel: () => string;
  isPremium: () => boolean;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  isLoading: false,
  isProcessing: false,
  error: null,
  plans: [],
  subscription: null,
  paymentUrl: null,
  paymentSuccess: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [plansResp, subResp] = await Promise.all([
        api.get('/payment/plans'),
        api.get('/payment/subscription'),
      ]);

      const plansRaw: unknown[] = Array.isArray((plansResp.data as Record<string, unknown>)?.plans)
        ? ((plansResp.data as Record<string, unknown>).plans as unknown[])
        : [];
      const plans = plansRaw.map((e) => parsePlanData(e as Record<string, unknown>));

      let sub: SubscriptionData | null = null;
      try {
        sub = parseSubscriptionData(subResp.data as Record<string, unknown>);
      } catch {
        sub = null;
      }

      set({ isLoading: false, plans, subscription: sub });
    } catch (e) {
      // If backend 404, use hardcoded defaults
      if (getStatus(e) === 404) {
        set({ isLoading: false, plans: DEFAULT_PLANS });
        return;
      }
      set({ isLoading: false, error: `Could not load plans: ${getErrorMessage(e)}` });
    }
  },

  createPayment: async (planId, method = 'vnpay') => {
    set({ isProcessing: true, error: null, paymentSuccess: null });
    try {
      const endpoint = method === 'momo' ? '/payment/momo/create' : '/payment/vnpay/create';
      const resp = await api.post(endpoint, { planType: planId });
      const data = resp.data as Record<string, unknown>;
      const url = (data.paymentUrl as string) ?? (data.payUrl as string) ?? undefined;

      if (url && url.length > 0) {
        set({ isProcessing: false, paymentUrl: url });
        return url;
      }

      // Some gateways return a deep-link or QR code
      set({
        isProcessing: false,
        paymentSuccess: 'Payment initiated. Please complete in your banking app.',
      });
      return null;
    } catch (e) {
      set({ isProcessing: false, error: `Payment failed: ${getErrorMessage(e)}` });
      return null;
    }
  },

  cancelSubscription: async () => {
    set({ isProcessing: true });
    try {
      await api.post('/payment/cancel');
      await get().load();
      set({ isProcessing: false });
      return true;
    } catch (e) {
      set({ isProcessing: false, error: `Could not cancel: ${getErrorMessage(e)}` });
      return false;
    }
  },

  clearPaymentUrl: () => set({ paymentUrl: null }),
  clearSuccess: () => set({ paymentSuccess: null }),

  currentPlanLabel: () => {
    const sub = get().subscription;
    if (!sub || sub.planId === 'FREE') return 'Free Plan';
    return sub.planId
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 0 ? `${w[0].toUpperCase()}${w.substring(1)}` : ''))
      .join(' ');
  },

  isPremium: () => {
    const sub = get().subscription;
    return sub != null && isPremiumSubscription(sub);
  },
}));

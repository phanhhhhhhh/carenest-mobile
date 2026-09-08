import { create } from 'zustand';
import api from '../../../core/api/client';
import { getStatus, getErrorMessage } from '../../../core/api/errors';
import { SubscriptionStatusSchema, safeParseOne } from '../../../shared/schemas';

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
  return isFreePlan(p) ? 'Miễn phí' : `${Math.trunc(p.price)}đ`;
}

export function getPeriodLabel(p: PlanData): string | null {
  if (p.id === 'PREMIUM_MONTHLY') return '/tháng';
  if (p.id === 'PREMIUM_YEARLY') return '/năm';
  return null;
}

export interface SubscriptionData {
  planType: string;
  isPremium: boolean;
  isPro?: boolean;
  expiresAt?: string;
}

function parseSubscriptionData(raw: unknown): SubscriptionData | null {
  const parsed = safeParseOne(SubscriptionStatusSchema, raw, 'SubscriptionStatus');
  if (!parsed) return null;
  return {
    planType: parsed.planType,
    isPremium: parsed.isPremium,
    isPro: parsed.isPro,
    expiresAt: parsed.expiresAt ?? undefined,
  };
}

export function isPremiumSubscription(s: SubscriptionData): boolean {
  return s.isPremium;
}

export function isProSubscription(_s: SubscriptionData): boolean {
  return false;
}

const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'FREE',
    name: 'Gói Miễn phí',
    price: 0,
    features: [
      'Theo dõi 1 hồ sơ người cao tuổi',
      'Kết nối 1 tài khoản người thân',
      'Lịch sử dữ liệu 7 ngày',
      'Theo dõi sức khỏe cơ bản',
      'Cảnh báo SOS khẩn cấp',
    ],
  },
  {
    id: 'PREMIUM_MONTHLY',
    name: 'CareNest Family Plus',
    price: 49000,
    currency: 'VND',
    features: [
      'Theo dõi tối đa 4 người cao tuổi',
      'Kết nối tối đa 6 tài khoản người thân',
      'Lịch sử dữ liệu không giới hạn',
      'Báo cáo tổng kết hàng tuần bằng AI',
      'Xuất báo cáo sức khỏe dạng PDF',
      'Hỗ trợ ưu tiên',
    ],
  },
  {
    id: 'PREMIUM_YEARLY',
    name: 'Premium Hàng năm',
    price: 490000,
    currency: 'VND',
    features: [
      'Đầy đủ tính năng gói Premium Hàng tháng',
      'Tiết kiệm 17% (tặng 2 tháng sử dụng)',
    ],
  },
];

export interface VietQrInfo {
  qrImageUrl: string;
  transactionId: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferMemo?: string;
}

interface PaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  plans: PlanData[];
  subscription: SubscriptionData | null;
  paymentUrl: string | null;
  paymentSuccess: string | null;
  vietqrInfo: VietQrInfo | null;

  load: () => Promise<void>;
  createPayment: (planId: string, method?: string) => Promise<string | null>;
  createVietQr: (planId: string) => Promise<VietQrInfo | null>;
  cancelSubscription: () => Promise<boolean>;
  clearPaymentUrl: () => void;
  clearSuccess: () => void;
  clearVietQr: () => void;
  currentPlanLabel: () => string;
  isPremium: () => boolean;
  isPro: () => boolean;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  isLoading: false,
  isProcessing: false,
  error: null,
  plans: [],
  subscription: null,
  paymentUrl: null,
  paymentSuccess: null,
  vietqrInfo: null,

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

      const sub = parseSubscriptionData(subResp.data);

      set({ isLoading: false, plans, subscription: sub });
    } catch (e) {
      if (getStatus(e) === 404) {
        set({ isLoading: false, plans: DEFAULT_PLANS });
        return;
      }
      set({ isLoading: false, error: `Không thể tải các gói: ${getErrorMessage(e)}` });
    }
  },

  createPayment: async (planId, method = 'vnpay') => {
    set({ isProcessing: true, error: null, paymentSuccess: null });
    try {
      const endpoint = method === 'momo' ? '/payment/momo/create' : '/payment/vnpay/create';
      const resp = await api.post(endpoint, { planType: planId });
      const data = resp.data as Record<string, unknown>;
      const url = (data.paymentUrl as string) ?? undefined;

      if (url && url.length > 0) {
        set({ isProcessing: false, paymentUrl: url });
        return url;
      }

      set({
        isProcessing: false,
        paymentSuccess:
          'Đã khởi tạo thanh toán. Vui lòng hoàn tất trong ứng dụng ngân hàng của bạn.',
      });
      return null;
    } catch (e) {
      set({ isProcessing: false, error: `Thanh toán thất bại: ${getErrorMessage(e)}` });
      return null;
    }
  },

  createVietQr: async (planId) => {
    set({ isProcessing: true, error: null, vietqrInfo: null });
    try {
      const resp = await api.post('/payment/vietqr/create', { planType: planId });
      const d = resp.data as Record<string, unknown>;
      const info: VietQrInfo = {
        qrImageUrl: (d.paymentUrl as string) ?? '',
        transactionId: (d.transactionId as string) ?? '',
        amount: d.amount != null ? Number(d.amount) : 0,
        bankName: (d.bankName as string) ?? undefined,
        accountNumber: (d.accountNumber as string) ?? undefined,
        accountName: (d.accountName as string) ?? undefined,
        transferMemo: (d.transferMemo as string) ?? undefined,
      };
      set({ isProcessing: false, vietqrInfo: info });
      return info;
    } catch (e) {
      set({ isProcessing: false, error: `Không tạo được mã VietQR: ${getErrorMessage(e)}` });
      return null;
    }
  },

  clearVietQr: () => set({ vietqrInfo: null }),

  cancelSubscription: async () => {
    set({ isProcessing: true });
    try {
      await api.post('/payment/cancel');
      await get().load();
      set({ isProcessing: false });
      return true;
    } catch (e) {
      set({ isProcessing: false, error: `Không thể hủy: ${getErrorMessage(e)}` });
      return false;
    }
  },

  clearPaymentUrl: () => set({ paymentUrl: null }),
  clearSuccess: () => set({ paymentSuccess: null }),

  currentPlanLabel: () => {
    const sub = get().subscription;
    if (!sub || sub.planType === 'FREE') return 'Gói Miễn phí';
    if (sub.planType === 'PREMIUM_MONTHLY') return 'Premium Hàng tháng';
    if (sub.planType === 'PREMIUM_YEARLY') return 'Premium Hàng năm';
    return sub.planType
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

  isPro: () => false,
}));

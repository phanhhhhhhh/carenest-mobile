import { create } from 'zustand';
import api from '../../../core/api/client';
import { getErrorMessage, isCancelled } from '../../../core/api/errors';
import { PendingPaymentSchema, safeParseList } from '../../../shared/schemas';
import { showErrorToast, showSuccessToast } from '../../../shared/components/toastStore';

export interface PendingPayment {
  transactionId: string;
  userId?: number;
  userName: string;
  planType: string;
  amount: number;
  provider?: string;
  createdAt?: string;
}

function toPendingPayment(p: ReturnType<typeof PendingPaymentSchema.parse>): PendingPayment {
  return {
    transactionId: p.transactionId,
    userId: p.userId ?? undefined,
    userName: p.userName ?? 'Không rõ',
    planType: p.planType,
    amount: p.amount ?? 0,
    provider: p.provider ?? undefined,
    createdAt: p.createdAt ?? undefined,
  };
}

/** Non-error confirm/reject outcomes the backend can report for a known transaction. */
const HANDLED_STATUSES = ['ACTIVATED', 'ALREADY_ACTIVE', 'REJECTED', 'NOT_PENDING'] as const;

interface AdminPaymentState {
  pending: PendingPayment[];
  isLoading: boolean;
  /** transactionId currently being confirmed/rejected, or null. */
  actingId: string | null;
  error: string | null;

  load: (signal?: AbortSignal) => Promise<void>;
  confirm: (transactionId: string) => Promise<boolean>;
  reject: (transactionId: string) => Promise<boolean>;
}

export const useAdminPaymentStore = create<AdminPaymentState>((set, get) => ({
  pending: [],
  isLoading: false,
  actingId: null,
  error: null,

  load: async (signal) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.get('/payment/pending', { signal });
      const list = safeParseList(PendingPaymentSchema, resp.data, 'PendingPayments').map(
        toPendingPayment,
      );
      set({ isLoading: false, pending: list });
    } catch (e) {
      if (isCancelled(e)) return;
      set({ isLoading: false, error: `Không tải được danh sách: ${getErrorMessage(e)}` });
    }
  },

  confirm: async (transactionId) => {
    return runAction(set, get, transactionId, '/payment/vietqr/confirm', 'Đã xác nhận thanh toán');
  },

  reject: async (transactionId) => {
    return runAction(set, get, transactionId, '/payment/vietqr/reject', 'Đã từ chối thanh toán');
  },
}));

async function runAction(
  set: (partial: Partial<AdminPaymentState>) => void,
  get: () => AdminPaymentState,
  transactionId: string,
  endpoint: string,
  successMessage: string,
): Promise<boolean> {
  set({ actingId: transactionId });
  try {
    const resp = await api.post(endpoint, { transactionId });
    const status = String((resp.data as { status?: string })?.status ?? '');

    if ((HANDLED_STATUSES as readonly string[]).includes(status)) {
      set({
        actingId: null,
        pending: get().pending.filter((p) => p.transactionId !== transactionId),
      });
      showSuccessToast(successMessage);
      return true;
    }

    // NOT_FOUND or an unexpected status — refresh so the list reflects reality.
    set({ actingId: null });
    showErrorToast('Giao dịch không còn ở trạng thái chờ. Đang làm mới danh sách.');
    await get().load();
    return false;
  } catch (e) {
    set({ actingId: null });
    showErrorToast(`Thao tác thất bại: ${getErrorMessage(e)}`);
    return false;
  }
}

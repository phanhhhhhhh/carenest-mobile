export interface PendingPayment {
  transactionId: string;
  userId: number | null;
  userName: string | null;
  planType: string;
  amount: number | null;
  provider: string | null;
  createdAt: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: AuthUser;
}

/** Non-error outcomes the confirm/reject endpoints report for a known transaction. */
export type ActionStatus =
  | 'ACTIVATED'
  | 'ALREADY_ACTIVE'
  | 'REJECTED'
  | 'NOT_PENDING'
  | 'NOT_FOUND';

export interface ActionResult {
  status: ActionStatus | string;
  message: string;
}

export interface Overview {
  totalUsers: number;
  usersByRole: Record<string, number>;
  elderlyProfiles: number;
  activeFamilyLinks: number;
  pendingFamilyLinks: number;
  activeSubscriptions: number;
  pendingPayments: number;
  cancelledSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  activeSubscriptionRevenue: number;
  checkInsToday: number;
  activeEmergencies: number;
}

export interface AdminUserRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string | null;
}

export interface AdminSubscriptionRow {
  id: number;
  userId: number | null;
  userName: string | null;
  userPhone: string | null;
  planType: string;
  status: string;
  paymentProvider: string | null;
  transactionId: string | null;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  cancelledAt: string | null;
  createdAt: string | null;
}

/** Spring Data Page envelope (the subset we use). */
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

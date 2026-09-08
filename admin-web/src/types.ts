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

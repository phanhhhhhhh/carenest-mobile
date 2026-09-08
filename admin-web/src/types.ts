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

export interface ActionResult {
  status: string;
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
  medications: number;
  appointments: number;
  camerasTotal: number;
  camerasOnline: number;
  healthMetrics7d: number;
  chatMessagesToday: number;
  notifications7d: number;
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

export interface AdminElderlyRow {
  profileId: number;
  userId: number | null;
  name: string | null;
  phone: string | null;
  dob: string | null;
  healthConditions: string[] | null;
  allergies: string | null;
  bloodType: string | null;
  weightKg: number | null;
  heightCm: number | null;
  cameraConsentStatus: string | null;
  cameraConsentDecidedAt: string | null;
  createdAt: string | null;
}

export interface AdminFamilyLinkRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  familyId: number | null;
  familyName: string | null;
  familyPhone: string | null;
  relationship: string | null;
  status: string | null;
  availabilityStatus: string | null;
  lastAckAt: string | null;
  createdAt: string | null;
}

export interface AdminEmergencyRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  status: string | null;
  escalationLevel: number;
  address: string | null;
  triggeredAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: number | null;
  escalatedAt: string | null;
  emergencyCallLoggedAt: string | null;
  resolvedAt: string | null;
  notes: string | null;
}

export interface AdminCheckInRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  mood: number | null;
  source: string | null;
  note: string | null;
  createdAt: string | null;
}

export interface AdminMedicationRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  name: string;
  dosage: string | null;
  instructions: string | null;
  hasVoiceReminder: boolean;
  nextDoseTime: string | null;
  createdAt: string | null;
}

export interface AdminHealthMetricRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  type: string | null;
  value: number | null;
  valueSecondary: number | null;
  unit: string | null;
  recordedAt: string | null;
  notes: string | null;
}

export interface AdminCameraRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  label: string | null;
  deviceSn: string | null;
  status: string | null;
  privacyMode: boolean;
  privacyModeExpiresAt: string | null;
  motionDetectionEnabled: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
}

export interface AdminNotificationRow {
  id: number;
  userId: number | null;
  userName: string | null;
  type: string | null;
  title: string | null;
  body: string | null;
  read: boolean;
  createdAt: string | null;
}

export interface AdminAppointmentRow {
  id: number;
  elderlyId: number | null;
  elderlyName: string | null;
  doctor: string | null;
  specialty: string | null;
  location: string | null;
  status: string | null;
  datetime: string | null;
}

export interface AdminUserDetail {
  user: AdminUserRow;
  elderlyProfile: AdminElderlyRow | null;
  activeSubscription: AdminSubscriptionRow | null;
  groupPremium: boolean;
  familyLinks: AdminFamilyLinkRow[];
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

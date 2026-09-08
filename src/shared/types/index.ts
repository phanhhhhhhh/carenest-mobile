export type UserRole = 'ELDERLY' | 'FAMILY';

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ElderlyProfile {
  id: string;
  name: string;
  healthConditions: string[];
  bloodType?: string;
  weight?: number;
  height?: number;
  allergies: string[];
  notes?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
  nextDoseTime?: string;
  scheduleTimes: string[];
  daysOfWeek: number[];
  taken: boolean;
  /** Optional family-recorded reminder voice (Family Plus). */
  voiceUrl?: string;
}

export interface MedicationLogEntry {
  id: string;
  medicationId: string;
  status: 'TAKEN' | 'MISSED';
  takenAt: string;
}

export interface HealthMetric {
  id: string;
  type: string;
  value: string;
  valueSecondary?: string;
  unit?: string;
  recordedAt: string;
}

export interface ElderlySummary {
  elderlyId: string;
  elderlyName: string;
  phone?: string;
  healthConditions: string[];
}

export interface AppointmentItem {
  id: string;
  doctor: string;
  specialty: string;
  location?: string;
  appointmentDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  createdAt?: string;
}

export interface EmergencyEvent {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  escalationLevel?: number;
  escalatedAt?: string;
  emergencyCallLoggedAt?: string;
  emergencyCallLoggedBy?: number;
  emergencyCallLoggedByName?: string;
}

/** Daily 1-touch check-in mood: 1 = happy, 2 = neutral, 3 = unwell, 4 = emergency (SOS). */
export type CheckInMood = 1 | 2 | 3 | 4;

export interface CheckIn {
  id: string;
  mood: CheckInMood;
  note?: string;
  source?: string;
  createdAt: string;
}

/** A family member's self-set availability for daily notifications (UC A3). Not used for SOS. */
export type AvailabilityStatus = 'FREE' | 'BUSY';

/** An in-flight sequential Free Broadcast (UC A3 / A4). */
export interface FamilyBroadcast {
  id: string;
  elderlyId: number;
  triggerType: string;
  title: string;
  body: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED';
  currentRecipientId?: number;
  startedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  escalatedAt?: string;
}

/** Family Care Feed (UC A2). */
export type FeedItemType = 'CHECK_IN' | 'MEDICATION_LOG' | 'EMERGENCY';

export interface FeedItem {
  /** Composite id "TYPE:ref" — stable per source row. */
  id: string;
  type: FeedItemType;
  itemRef: number;
  occurredAt: string;
  title: string;
  subtitle: string;
  /** Generic "someone dealt with this" — the feed never shows who. */
  handled: boolean;
  reactionCount: number;
  reactedByMe: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  messageId: number;
  role: 'USER' | 'AI';
  content: string;
  intent?: string;
  sessionId?: string;
  createdAt: string;
}

export interface CameraStatusResponse {
  hasCamera: boolean;
  cameraCount?: number;
  allOnline?: boolean;
  indicatorColor?: string;
  statusText?: string;
  message?: string;
}

export interface GoogleFitStatusResponse {
  connected: boolean;
  configured: boolean;
}

export interface PaymentInitResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
  planType: string;
  provider: 'VNPAY' | 'MOMO';
}
